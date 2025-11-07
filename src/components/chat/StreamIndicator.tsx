export function StreamIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="text-xs font-medium mb-1 text-left text-gray-600">Learning Cents</div>
        <div className="px-4 py-3 bg-gray-100 rounded-lg rounded-bl-none">
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
