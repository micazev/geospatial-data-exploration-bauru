import { create } from 'zustand'
import type { FeatureCollection } from 'geojson'
import { DEFAULT_VISIBLE } from '../api/layerConfig'

interface LayerStore {
  visibleLayers: Set<string>
  geoData: Record<string, FeatureCollection>
  loadingLayers: Set<string>
  toggleLayer: (id: string) => void
  setGeoData: (id: string, data: FeatureCollection) => void
  setLoading: (id: string, loading: boolean) => void
  isVisible: (id: string) => boolean
}

export const useLayerStore = create<LayerStore>((set, get) => ({
  visibleLayers: new Set(DEFAULT_VISIBLE),
  geoData: {},
  loadingLayers: new Set(),

  toggleLayer: (id) =>
    set((state) => {
      const next = new Set(state.visibleLayers)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return { visibleLayers: next }
    }),

  setGeoData: (id, data) =>
    set((state) => ({
      geoData: { ...state.geoData, [id]: data },
    })),

  setLoading: (id, loading) =>
    set((state) => {
      const next = new Set(state.loadingLayers)
      if (loading) next.add(id)
      else next.delete(id)
      return { loadingLayers: next }
    }),

  isVisible: (id) => get().visibleLayers.has(id),
}))
