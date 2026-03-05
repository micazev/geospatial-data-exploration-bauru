import { useEffect } from 'react'
import { useLayerStore } from './useLayerStore'

const dataCache = new Map<string, Promise<unknown>>()

export function useGeoData(layerId: string) {
  const { geoData, setGeoData, setLoading, visibleLayers } = useLayerStore()
  const isVisible = visibleLayers.has(layerId)
  const data = geoData[layerId]

  useEffect(() => {
    if (!isVisible || data) return

    if (dataCache.has(layerId)) {
      dataCache.get(layerId)!.then((d) => setGeoData(layerId, d as never))
      return
    }

    setLoading(layerId, true)
    const promise = fetch(`/data/${layerId}.geojson`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${layerId}`)
        return res.json()
      })
      .then((geojson) => {
        setGeoData(layerId, geojson)
        setLoading(layerId, false)
        return geojson
      })
      .catch((err) => {
        console.warn(`Could not load layer ${layerId}:`, err.message)
        setLoading(layerId, false)
        dataCache.delete(layerId)
      })

    dataCache.set(layerId, promise)
  }, [isVisible, layerId, data, setGeoData, setLoading])

  return data
}
