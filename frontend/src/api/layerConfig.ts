import type { LayerGroups } from '../types/geo'

export const LAYER_GROUPS: LayerGroups = {
  boundaries: {
    label: 'Limites',
    layers: [
      { id: 'limite_municipal', label: 'Limite Municipal', color: '#808080', type: 'polygon', fillOpacity: 0, weight: 2, defaultVisible: true },
      { id: 'perimetro_urbano_2018', label: 'Perimetro Urbano', color: '#9370DB', type: 'polygon', fillOpacity: 0.1, weight: 2 },
      { id: 'municipios_vizinhos', label: 'Municipios Vizinhos', color: '#B0B0B0', type: 'polygon', fillOpacity: 0, weight: 1 },
    ],
  },
  urban: {
    label: 'Urbano',
    layers: [
      { id: 'mancha_urbana', label: 'Mancha Urbana', color: '#FA8072', type: 'polygon', fillOpacity: 0.3, defaultVisible: true },
      { id: 'loteamentos_bauru', label: 'Loteamentos', color: '#CD5C5C', type: 'polygon', fillOpacity: 0.3 },
      { id: 'setores_planejamento', label: 'Setores de Planejamento', color: '#FF6347', type: 'polygon', fillOpacity: 0.2, weight: 1 },
    ],
  },
  hydrology: {
    label: 'Hidrografia',
    layers: [
      { id: 'cursos_dagua', label: "Cursos d'Agua", color: '#87CEFA', type: 'line', weight: 2 },
      { id: 'massa_dagua', label: "Massa d'Agua", color: '#4169E1', type: 'polygon', fillOpacity: 0.5 },
    ],
  },
  transportation: {
    label: 'Transporte',
    layers: [
      { id: 'vias_principais', label: 'Vias Principais', color: '#FFD700', type: 'line', weight: 2 },
      { id: 'vias_locais', label: 'Vias Locais', color: '#C0C0C0', type: 'line', weight: 1 },
      { id: 'vias_rurais', label: 'Vias Rurais', color: '#FFE4B5', type: 'line', weight: 1 },
      { id: 'rodovias', label: 'Rodovias', color: '#FFA500', type: 'line', weight: 3 },
      { id: 'ferrovia', label: 'Ferrovia', color: '#333333', type: 'line', weight: 2 },
    ],
  },
  terrain: {
    label: 'Relevo',
    layers: [
      { id: 'curvas_10', label: 'Curvas de Nivel', color: '#D2B48C', type: 'line', weight: 1 },
    ],
  },
}

export const ALL_LAYER_IDS = Object.values(LAYER_GROUPS).flatMap(g => g.layers.map(l => l.id))

export const DEFAULT_VISIBLE = Object.values(LAYER_GROUPS)
  .flatMap(g => g.layers)
  .filter(l => l.defaultVisible)
  .map(l => l.id)

export function getLayerConfig(id: string) {
  for (const group of Object.values(LAYER_GROUPS)) {
    const layer = group.layers.find(l => l.id === id)
    if (layer) return layer
  }
  return undefined
}
