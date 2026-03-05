import type { FeatureCollection } from 'geojson'

export type LayerType = 'line' | 'polygon'

export interface LayerConfig {
  id: string
  label: string
  color: string
  type: LayerType
  fillOpacity?: number
  weight?: number
  defaultVisible?: boolean
}

export interface LayerGroup {
  label: string
  layers: LayerConfig[]
}

export type LayerGroups = Record<string, LayerGroup>

export type GeoDataMap = Record<string, FeatureCollection>
