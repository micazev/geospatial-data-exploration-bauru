"""
Download and generate shapefiles for the Bauru geospatial project.

Sources:
- IBGE: Municipal boundaries, state boundaries
- OpenStreetMap (Overpass API): Water courses, water bodies, roads, railways
"""

import os
import json
import time
import requests
import geopandas as gpd
from shapely.geometry import shape

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
OUTPUT_DIR = os.path.join(BASE_DIR, "data")

BAURU_CODE = "3506003"
# Tighter bbox around Bauru municipality proper
BAURU_BBOX = (-49.22, -22.47, -48.94, -22.18)  # (west, south, east, north)
BAURU_OVERPASS_BBOX = "(-22.47,-49.22,-22.18,-48.94)"  # (south,west,north,east)

CRS_PROJECTED = "EPSG:31982"  # UTM zone 22S (original CRS from notebook)


def ensure_dirs():
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def extract_bauru_from_ibge():
    """Extract Bauru-related data from IBGE SP municipalities shapefile."""
    print("=== Extracting from IBGE data ===")

    sp_mun_path = os.path.join(RAW_DIR, "SP_Municipios", "SP_Municipios_2022.shp")
    br_uf_path = os.path.join(RAW_DIR, "BR_UF", "BR_UF_2022.shp")

    if not os.path.exists(sp_mun_path):
        print(f"ERROR: {sp_mun_path} not found. Download IBGE data first.")
        return

    sp_mun = gpd.read_file(sp_mun_path)
    print(f"  Loaded SP municipalities: {len(sp_mun)} features")

    # 1. Limite municipal (Bauru boundary)
    bauru = sp_mun[sp_mun["CD_MUN"] == BAURU_CODE].copy()
    if len(bauru) == 0:
        print("  ERROR: Bauru not found in IBGE data!")
        return
    bauru_projected = bauru.to_crs(CRS_PROJECTED)
    save_shp(bauru_projected, "limite_municipal")

    # 2. Perimetro municipal (same geometry, add area column)
    perimetro = bauru_projected.copy()
    perimetro["Area"] = perimetro.geometry.area / 1000
    save_shp(perimetro, "perimetro_municipal")

    # 3. Municipios vizinhos (neighboring municipalities)
    bauru_geom = bauru.geometry.values[0]
    neighbors = sp_mun[sp_mun.geometry.touches(bauru_geom) | sp_mun.geometry.intersects(bauru_geom)].copy()
    neighbors_projected = neighbors.to_crs(CRS_PROJECTED)
    save_shp(neighbors_projected, "municipios_vizinhos")
    print(f"  Found {len(neighbors)} neighboring municipalities")

    # 4. Estados (IBGE)
    if os.path.exists(br_uf_path):
        estados = gpd.read_file(br_uf_path)
        estados_projected = estados.to_crs(CRS_PROJECTED)
        save_shp(estados_projected, "estados_ibge")
        print(f"  States: {len(estados)} features")


def overpass_query(query, description, retries=3):
    """Execute an Overpass API query and return GeoJSON features."""
    print(f"  Querying Overpass: {description}...")
    url = "https://overpass-api.de/api/interpreter"
    for attempt in range(retries):
        try:
            resp = requests.post(url, data={"data": query}, timeout=180)
            resp.raise_for_status()
            data = resp.json()
            return data.get("elements", [])
        except (requests.exceptions.HTTPError, requests.exceptions.Timeout) as e:
            if attempt < retries - 1:
                wait = 10 * (attempt + 1)
                print(f"    Retry {attempt + 1}/{retries} after {wait}s ({e})")
                time.sleep(wait)
            else:
                print(f"    FAILED after {retries} attempts: {e}")
                return []


def elements_to_gdf(elements, geom_type="line"):
    """Convert Overpass API elements to a GeoDataFrame."""
    features = []
    for el in elements:
        props = el.get("tags", {})
        props["osm_id"] = el.get("id")

        if el["type"] == "way" and "geometry" in el:
            coords = [(n["lon"], n["lat"]) for n in el["geometry"]]
            if geom_type == "polygon" and len(coords) >= 4 and coords[0] == coords[-1]:
                geojson_geom = {"type": "Polygon", "coordinates": [coords]}
            else:
                geojson_geom = {"type": "LineString", "coordinates": coords}
            features.append({"type": "Feature", "geometry": geojson_geom, "properties": props})

        elif el["type"] == "relation" and "members" in el:
            # For relations, collect outer ways
            outer_coords = []
            for member in el.get("members", []):
                if member.get("role") == "outer" and "geometry" in member:
                    coords = [(n["lon"], n["lat"]) for n in member["geometry"]]
                    outer_coords.append(coords)
            if outer_coords:
                if geom_type == "polygon":
                    if len(outer_coords) == 1:
                        geojson_geom = {"type": "Polygon", "coordinates": outer_coords}
                    else:
                        geojson_geom = {"type": "MultiPolygon", "coordinates": [[c] for c in outer_coords]}
                else:
                    geojson_geom = {"type": "MultiLineString", "coordinates": outer_coords}
                features.append({"type": "Feature", "geometry": geojson_geom, "properties": props})

    if not features:
        return None

    geojson = {"type": "FeatureCollection", "features": features}
    gdf = gpd.GeoDataFrame.from_features(geojson, crs="EPSG:4326")
    return gdf


def download_osm_data():
    """Download various layers from OpenStreetMap via Overpass API."""
    print("\n=== Downloading OSM data for Bauru ===")
    bbox = BAURU_OVERPASS_BBOX

    # Helper to add delay between queries (Overpass rate limiting)
    def query_with_delay(q, desc, geom="line"):
        elements = overpass_query(q, desc)
        print(f"    Got {len(elements)} elements")
        time.sleep(2)
        return elements_to_gdf(elements, geom)

    # 1. Cursos d'agua (water courses)
    q = f"""[out:json][timeout:90];
    (way["waterway"~"river|stream|canal|drain"]{bbox};
     relation["waterway"~"river|stream|canal"]{bbox};);
    out body geom;"""
    gdf = query_with_delay(q, "water courses")
    if gdf is not None:
        save_shp(gdf.to_crs(CRS_PROJECTED), "cursos_dagua")

    # 2. Massa d'agua (water bodies)
    q = f"""[out:json][timeout:90];
    (way["natural"="water"]{bbox};
     relation["natural"="water"]{bbox};
     way["landuse"="reservoir"]{bbox};
     relation["landuse"="reservoir"]{bbox};);
    out body geom;"""
    gdf = query_with_delay(q, "water bodies", "polygon")
    if gdf is not None:
        save_shp(gdf.to_crs(CRS_PROJECTED), "massa_dagua")

    # 3. Ferrovia (railway)
    q = f"""[out:json][timeout:90];
    (way["railway"="rail"]{bbox};);
    out body geom;"""
    gdf = query_with_delay(q, "railways")
    if gdf is not None:
        save_shp(gdf.to_crs(CRS_PROJECTED), "ferrovia")

    # 4. Rodovias (highways/major roads)
    q = f"""[out:json][timeout:90];
    (way["highway"~"trunk|trunk_link|motorway|motorway_link"]{bbox};);
    out body geom;"""
    gdf = query_with_delay(q, "highways")
    if gdf is not None:
        save_shp(gdf.to_crs(CRS_PROJECTED), "rodovias")

    # 5. Vias principais (main roads)
    q = f"""[out:json][timeout:90];
    (way["highway"~"primary|secondary|primary_link|secondary_link"]{bbox};);
    out body geom;"""
    gdf = query_with_delay(q, "main roads")
    if gdf is not None:
        save_shp(gdf.to_crs(CRS_PROJECTED), "vias_principais")

    # 6. Vias locais (local roads)
    q = f"""[out:json][timeout:90];
    (way["highway"~"residential|tertiary|tertiary_link|unclassified|living_street"]{bbox};);
    out body geom;"""
    gdf = query_with_delay(q, "local roads")
    if gdf is not None:
        save_shp(gdf.to_crs(CRS_PROJECTED), "vias_locais")

    # 7. Vias rurais (rural roads)
    q = f"""[out:json][timeout:90];
    (way["highway"~"track|path|bridleway"]{bbox};);
    out body geom;"""
    gdf = query_with_delay(q, "rural roads")
    if gdf is not None:
        save_shp(gdf.to_crs(CRS_PROJECTED), "vias_rurais")


def save_shp(gdf, name):
    """Save GeoDataFrame as shapefile in the output directory."""
    out_path = os.path.join(OUTPUT_DIR, f"{name}.shp")
    gdf.to_file(out_path, driver="ESRI Shapefile")
    print(f"  Saved: {out_path} ({len(gdf)} features)")


def print_summary():
    """Print summary of all shapefiles in data directory."""
    print("\n=== Summary ===")
    shp_files = sorted(f for f in os.listdir(OUTPUT_DIR) if f.endswith(".shp"))
    for f in shp_files:
        path = os.path.join(OUTPUT_DIR, f)
        gdf = gpd.read_file(path)
        print(f"  {f}: {len(gdf)} features, CRS={gdf.crs}")

    print("\n--- Layers NOT available from public sources ---")
    print("  These require the original files from Google Drive:")
    missing = [
        "curvas_10_10.shp       (contour lines - needs SRTM/TOPODATA or original)",
        "loteamentos_bauru.shp  (subdivisions - municipal planning data)",
        "mancha_urbana.shp      (urban sprawl - municipal planning data)",
        "perimetro_urbano.shp   (urban perimeter - municipal planning data)",
        "setores_planejamento.shp (planning sectors - municipal planning data)",
        "regiao_adm.shp         (administrative region - municipal planning data)",
    ]
    for m in missing:
        print(f"    - {m}")


if __name__ == "__main__":
    ensure_dirs()
    extract_bauru_from_ibge()
    download_osm_data()
    print_summary()
