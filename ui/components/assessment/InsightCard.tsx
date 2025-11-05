import type { Insight } from '../../types/assessment';
import EducationList from './EducationList';

interface InsightCardProps {
  insight: Insight;
  isPriority?: boolean;
}

export default function InsightCard({ insight, isPriority = false }: InsightCardProps) {
  return (
    <div
      className={`border rounded-lg p-6 ${
        isPriority ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
    >
      {isPriority && (
        <div className="text-xs font-semibold text-blue-600 uppercase mb-2">
          Priority Insight
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4 text-gray-900">{insight.personaLabel}</h2>

      <div className="prose max-w-none mb-6">
        <p className="text-gray-700">{insight.renderedForUser}</p>
      </div>

      <EducationList items={insight.educationItems} />
    </div>
  );
}
