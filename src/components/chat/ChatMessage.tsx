interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: string; text: string }>;
  createdAt?: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const textPart = message.parts.find((p) => p.type === 'text');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Role label */}
        <div
          className={`text-xs font-medium mb-1 ${isUser ? 'text-right text-blue-600' : 'text-left text-gray-600'}`}
        >
          {isUser ? 'You' : 'Learning Cents'}
        </div>

        {/* Message bubble */}
        <div
          className={`
            px-4 py-3 rounded-lg
            ${
              isUser
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{textPart?.text || ''}</p>
        </div>

        {/* Timestamp */}
        {message.createdAt && (
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
}
