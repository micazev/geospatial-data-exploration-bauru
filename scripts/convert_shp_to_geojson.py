"""
Convert shapefiles from the Bauru dataset to GeoJSON (WGS84).

Usage:
    python scripts/convert_shp_to_geojson.py <shp_directory> <output_directory>

Example:
    python scripts/convert_shp_to_geojson.py "/path/to/00_SHP BASE" frontend/public/data
"""

import sys
from pathlib import Path
import geopandas as gpd

LAYER_MAP = {
    "curvas_10_10.shp": "curvas_10",
    "cursos_dagua.shp": "cursos_dagua",
    "ferrovia.shp": "ferrovia",
    "limite_municipal.shp": "limite_municipal",
    "loteamentos_bauru.shp": "loteamentos_bauru",
    "mancha_urbana_(planodemanejo).shp": "mancha_urbana",
    "massa_dagua.shp": "massa_dagua",
    "municipios_vizinhos.shp": "municipios_vizinhos",
    "perimetro_urbano_2018.shp": "perimetro_urbano_2018",
    "rodovias.shp": "rodovias",
    "setores_planejamento.shp": "setores_planejamento",
    "vias_locais.shp": "vias_locais",
    "vias_principais.shp": "vias_principais",
    "vias_rurais.shp": "vias_rurais",
}


def convert(shp_dir: Path, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)

    for shp_name, layer_id in LAYER_MAP.items():
        shp_path = shp_dir / shp_name
        if not shp_path.exists():
            print(f"  SKIP {shp_name} (not found)")
            continue

        print(f"  Converting {shp_name} -> {layer_id}.geojson")
        gdf = gpd.read_file(shp_path)

        # Reproject to WGS84 for web maps
        if gdf.crs and gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)

        # Drop Z coordinates if present
        gdf.geometry = gdf.geometry.map(
            lambda geom: gpd.GeoSeries([geom]).force_2d().iloc[0]
            if hasattr(gpd.GeoSeries, 'force_2d')
            else geom
        )

        out_path = out_dir / f"{layer_id}.geojson"
        gdf.to_file(out_path, driver="GeoJSON")
        print(f"    -> {out_path} ({len(gdf)} features)")

    print("\nDone!")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    shp_dir = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])

    if not shp_dir.is_dir():
        print(f"Error: {shp_dir} is not a directory")
        sys.exit(1)

    convert(shp_dir, out_dir)
