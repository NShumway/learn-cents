import { useState, useEffect, useCallback } from 'react';
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
  console.log('[CHAT HISTORY] Component rendering, userId:', userId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    console.log('[CHAT HISTORY] Starting loadMessages...');
    setLoading(true);
    setError(null);

    try {
      console.log('[CHAT HISTORY] Getting access token...');
      const token = await getAccessToken();
      console.log('[CHAT HISTORY] Token received, fetching...');

      const res = await fetch(`/api/admin/chat-history?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[CHAT HISTORY] Fetch completed, status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load messages (${res.status})`);
      }

      console.log('[CHAT HISTORY] Parsing JSON...');
      const data = await res.json();
      console.log('[CHAT HISTORY] Received data:', data);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

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
