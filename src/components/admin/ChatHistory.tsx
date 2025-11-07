import { useState, useEffect } from 'react';
import { getAccessToken } from '../../../ui/lib/auth';

interface ChatMessage {
  id: string;
  assessmentId: string;
  role: string;
  content: string;
  flagged: boolean;
  flagReason: string | null;
  createdAt: string;
}

interface ChatHistoryProps {
  userId: string;
}

export function ChatHistory({ userId }: ChatHistoryProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const loadMessages = async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/admin/chat/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to load messages');

      const { messages } = await res.json();
      setMessages(messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async (messageId: string) => {
    const reason = prompt('Reason for flagging:');
    if (!reason) return;

    try {
      const token = await getAccessToken();
      await fetch('/api/admin/flag-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageId, reason }),
      });

      // Reload messages
      loadMessages();
    } catch {
      alert('Failed to flag message');
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Loading chat history...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600">No chat messages found for this user.</div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Chat History ({messages.length} messages)</h3>

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`p-4 rounded-lg border ${
            msg.flagged ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-medium text-sm text-gray-600">
              {msg.role === 'user' ? 'User' : 'Assistant'}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(msg.createdAt).toLocaleString()}
            </span>
          </div>

          <p className="text-gray-900 whitespace-pre-wrap mb-2">{msg.content}</p>

          {msg.flagged && msg.flagReason && (
            <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
              <strong>Flagged:</strong> {msg.flagReason}
            </div>
          )}

          {!msg.flagged && msg.role === 'assistant' && (
            <button
              onClick={() => handleFlag(msg.id)}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              Flag this message
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
