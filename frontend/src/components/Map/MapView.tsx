import { MapContainer, TileLayer } from 'react-leaflet'
import type { Feature } from 'geojson'
import { GeoJSONLayer } from './GeoJSONLayer'
import { useLayerStore } from '../../hooks/useLayerStore'
import { LAYER_GROUPS, getLayerConfig } from '../../api/layerConfig'
import 'leaflet/dist/leaflet.css'

const BAURU_CENTER: [number, number] = [-22.3154, -49.0615]
const DEFAULT_ZOOM = 12

const TILE_LAYERS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
  },
}

interface Props {
  baseMap: keyof typeof TILE_LAYERS
  onFeatureClick?: (feature: Feature) => void
}

export function MapView({ baseMap, onFeatureClick }: Props) {
  const visibleLayers = useLayerStore((s) => s.visibleLayers)
  const tile = TILE_LAYERS[baseMap]

  const allLayers = Object.values(LAYER_GROUPS).flatMap((g) => g.layers)
  const activeLayers = allLayers.filter((l) => visibleLayers.has(l.id))

  return (
    <MapContainer center={BAURU_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full z-0">
      <TileLayer url={tile.url} attribution={tile.attribution} />
      {activeLayers.map((layer) => {
        const config = getLayerConfig(layer.id)
        if (!config) return null
        return (
          <GeoJSONLayer
            key={layer.id}
            config={config}
            onFeatureClick={onFeatureClick}
          />
        )
      })}
    </MapContainer>
  )
}

export type BaseMapKey = keyof typeof TILE_LAYERS
export const BASE_MAP_OPTIONS: { key: BaseMapKey; label: string }[] = [
  { key: 'osm', label: 'OpenStreetMap' },
  { key: 'satellite', label: 'Satelite' },
  { key: 'topo', label: 'Topografico' },
]
