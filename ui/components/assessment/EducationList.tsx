import type { EducationItem } from '../../types/assessment';

interface EducationListProps {
  items: EducationItem[];
}

export default function EducationList({ items }: EducationListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-3 text-gray-900">Learn More</h3>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
              {index + 1}
            </div>
            <div>
              <div className="font-medium text-gray-900">{item.title}</div>
              <div className="text-sm text-gray-600">{item.description}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
