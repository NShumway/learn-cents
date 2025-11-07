import { useState } from 'react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { useChat } from '../../hooks/useChat';

interface ChatContainerProps {
  assessmentId: string;
}

export function ChatContainer({ assessmentId }: ChatContainerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages, sendMessage, isLoading, error } = useChat({
    assessmentId,
    onError: (err) => console.error(err),
  });

  if (!isExpanded) {
    return (
      <div className="mt-8 border-t border-gray-200 pt-8">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Ask Questions About Your Assessment
        </button>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Chat with our AI assistant to learn more about your financial health
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-8 animate-slideDown">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Chat with Learning Cents</h3>
            <p className="text-sm text-gray-600">Ask questions about your assessment</p>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close chat"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <ChatMessages messages={messages} isLoading={isLoading} />

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error.message || 'An error occurred. Please try again.'}
            </div>
          )}
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
