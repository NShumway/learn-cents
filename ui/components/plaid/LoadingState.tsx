/**
 * Loading State Component
 *
 * Displays processing indicator with progress bar during assessment generation
 */

interface LoadingStateProps {
  stage: string;
  percent: number;
}

export default function LoadingState({ stage, percent }: LoadingStateProps) {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
      <div className="text-lg font-medium mb-2">{stage}</div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <div className="text-sm text-gray-600 mt-2">{percent}%</div>
    </div>
  );
}
