import type { Feature } from 'geojson'

interface Props {
  feature: Feature | null
  onClose: () => void
}

export function FeatureDetails({ feature, onClose }: Props) {
  if (!feature) return null

  const props = feature.properties
  if (!props || Object.keys(props).length === 0) return null

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md w-full z-[1000]">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold text-gray-800">Detalhes</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          &times;
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto">
        <table className="text-sm w-full">
          <tbody>
            {Object.entries(props)
              .filter(([, v]) => v != null)
              .map(([key, value]) => (
                <tr key={key} className="border-b border-gray-100 last:border-0">
                  <td className="py-1 pr-3 font-medium text-gray-600 whitespace-nowrap">{key}</td>
                  <td className="py-1 text-gray-800">{String(value)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
