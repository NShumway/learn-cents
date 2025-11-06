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
  // Default stage if none provided
  const displayStage = stage || 'Connecting to Plaid Sandbox...';

  return (
    <div className="max-w-md mx-auto text-center mt-20">
      <div className="mb-6">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
      <div className="text-xl font-semibold text-gray-900 mb-4">{displayStage}</div>

      {/* Progress bar */}
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
