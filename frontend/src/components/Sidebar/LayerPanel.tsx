import { LAYER_GROUPS } from '../../api/layerConfig'
import { useLayerStore } from '../../hooks/useLayerStore'
import { LayerGroup } from './LayerGroup'
import type { BaseMapKey } from '../Map/MapView'
import { BASE_MAP_OPTIONS } from '../Map/MapView'

interface Props {
  baseMap: BaseMapKey
  onBaseMapChange: (key: BaseMapKey) => void
}

export function LayerPanel({ baseMap, onBaseMapChange }: Props) {
  const { visibleLayers, toggleLayer, loadingLayers } = useLayerStore()

  return (
    <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-800">Bauru</h1>
        <p className="text-xs text-gray-500 mt-1">Explorador Geoespacial</p>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mapa Base</h3>
        <select
          value={baseMap}
          onChange={(e) => onBaseMapChange(e.target.value as BaseMapKey)}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
        >
          {BASE_MAP_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(LAYER_GROUPS).map(([key, group]) => (
          <LayerGroup
            key={key}
            label={group.label}
            layers={group.layers}
            visibleLayers={visibleLayers}
            loadingLayers={loadingLayers}
            onToggle={toggleLayer}
          />
        ))}
      </div>
    </div>
  )
}
