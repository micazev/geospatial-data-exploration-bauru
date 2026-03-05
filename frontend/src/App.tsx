import { useState } from 'react'
import type { Feature } from 'geojson'
import { MapView } from './components/Map/MapView'
import type { BaseMapKey } from './components/Map/MapView'
import { LayerPanel } from './components/Sidebar/LayerPanel'
import { FeatureDetails } from './components/InfoPanel/FeatureDetails'

export default function App() {
  const [baseMap, setBaseMap] = useState<BaseMapKey>('osm')
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  return (
    <div className="flex h-screen w-screen">
      <LayerPanel baseMap={baseMap} onBaseMapChange={setBaseMap} />
      <div className="flex-1 relative">
        <MapView baseMap={baseMap} onFeatureClick={setSelectedFeature} />
        <FeatureDetails feature={selectedFeature} onClose={() => setSelectedFeature(null)} />
      </div>
    </div>
  )
}
