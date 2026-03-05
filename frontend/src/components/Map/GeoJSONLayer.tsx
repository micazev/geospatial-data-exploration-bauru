import { GeoJSON } from 'react-leaflet'
import type { Layer, Path, PathOptions } from 'leaflet'
import type { Feature } from 'geojson'
import type { LayerConfig } from '../../types/geo'
import { useGeoData } from '../../hooks/useGeoData'

interface Props {
  config: LayerConfig
  onFeatureClick?: (feature: Feature) => void
}

export function GeoJSONLayer({ config, onFeatureClick }: Props) {
  const data = useGeoData(config.id)

  if (!data) return null

  const style: PathOptions = {
    color: config.color,
    weight: config.weight ?? (config.type === 'line' ? 2 : 1),
    fillOpacity: config.type === 'polygon' ? (config.fillOpacity ?? 0.3) : 0,
    opacity: 0.8,
  }

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const props = feature.properties
    if (props && Object.keys(props).length > 0) {
      const rows = Object.entries(props)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `<tr><td class="font-semibold pr-2">${k}</td><td>${v}</td></tr>`)
        .join('')
      layer.bindPopup(`<table class="text-sm">${rows}</table>`, { maxWidth: 300 })
    }

    if (onFeatureClick) {
      ;(layer as Path).on('click', () => onFeatureClick(feature))
    }
  }

  return (
    <GeoJSON
      key={config.id}
      data={data}
      style={style}
      onEachFeature={onEachFeature}
    />
  )
}
