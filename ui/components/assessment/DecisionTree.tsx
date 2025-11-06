import type { DecisionTree } from '../../types/assessment';

interface DecisionTreeProps {
  tree: DecisionTree;
}

export default function DecisionTreeComponent({ tree }: DecisionTreeProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">How We Determined Your Insights</h3>

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Signals Detected</div>
        <div className="flex flex-wrap gap-2">
          {tree.signalsDetected.map((signal, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
            >
              {signal}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Personas Considered</div>
        <div className="space-y-2">
          {tree.personasEvaluated.map((persona, index) => (
            <div
              key={index}
              className={`p-3 rounded ${
                persona.matched
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-sm font-medium ${
                    persona.matched ? 'text-blue-900' : 'text-gray-600'
                  }`}
                >
                  {persona.persona.replace(/_/g, ' ')}
                </span>
                {persona.matched && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium">
                    Matched
                  </span>
                )}
              </div>
              {persona.criteria.length > 0 && (
                <div className="text-xs text-gray-600">{persona.criteria.join(', ')}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
        <div className="text-sm font-medium text-yellow-900 mb-1">Priority Reasoning</div>
        <div className="text-sm text-yellow-800">{tree.reasoning}</div>
      </div>
    </div>
  );
}
