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
      <div className="text-xl font-semibold text-gray-900">{displayStage}</div>
    </div>
  );
}
