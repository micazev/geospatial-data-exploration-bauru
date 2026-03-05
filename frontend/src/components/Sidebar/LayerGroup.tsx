import { useState } from 'react'
import type { LayerConfig } from '../../types/geo'

interface Props {
  label: string
  layers: LayerConfig[]
  visibleLayers: Set<string>
  loadingLayers: Set<string>
  onToggle: (id: string) => void
}

export function LayerGroup({ label, layers, visibleLayers, loadingLayers, onToggle }: Props) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center w-full text-left text-sm font-semibold text-gray-700 hover:text-gray-900"
      >
        <span className={`mr-1.5 text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>
          &#9654;
        </span>
        {label}
        <span className="ml-auto text-xs text-gray-400">
          {layers.filter((l) => visibleLayers.has(l.id)).length}/{layers.length}
        </span>
      </button>

      {expanded && (
        <div className="mt-1.5 ml-3 space-y-1">
          {layers.map((layer) => {
            const isVisible = visibleLayers.has(layer.id)
            const isLoading = loadingLayers.has(layer.id)

            return (
              <label
                key={layer.id}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer py-0.5"
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => onToggle(layer.id)}
                  className="rounded border-gray-300"
                />
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0 border border-gray-300"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="truncate">{layer.label}</span>
                {isLoading && (
                  <span className="ml-auto text-xs text-gray-400 animate-pulse">...</span>
                )}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
