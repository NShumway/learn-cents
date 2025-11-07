import { useState, useEffect } from 'react';
import { getAccessToken } from '../../ui/lib/auth';

interface UseChatOptions {
  assessmentId: string;
  onError?: (error: Error) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: string; text: string }>;
  createdAt?: Date;
}

export function useChat({ assessmentId, onError }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/chat/history?assessmentId=${assessmentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to load chat history');

        const { messages: historyMessages } = await res.json();

        // Convert to Message format
        interface HistoryMessage {
          id: string;
          role: 'user' | 'assistant';
          content: string;
          createdAt: string;
        }
        const formattedMessages = (historyMessages as HistoryMessage[]).map((msg) => ({
          id: msg.id,
          role: msg.role,
          parts: [{ type: 'text', text: msg.content }],
          createdAt: new Date(msg.createdAt),
        }));

        setMessages(formattedMessages);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    }

    loadHistory();
  }, [assessmentId]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message optimistically
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      parts: [{ type: 'text', text: content }],
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          assessmentId,
        }),
      });

      if (!response.ok) {
        // Try to parse error response for better error messages
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If we can't parse the error, use default message
        }
        throw new Error(errorMessage);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      const assistantId = (Date.now() + 1).toString();

      if (reader) {
        // Add initial empty assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant' as const,
            parts: [{ type: 'text', text: '' }],
            createdAt: new Date(),
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantMessage += chunk;

          // Update assistant message as it streams
          setMessages((prev) => {
            return prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    parts: [{ type: 'text', text: assistantMessage }],
                  }
                : msg
            );
          });
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    isLoading,
    error,
  };
}
