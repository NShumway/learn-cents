import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getAccessToken } from '../../lib/auth';
import InsightCard from '../../components/assessment/InsightCard';
import DecisionTreeComponent from '../../components/assessment/DecisionTree';
import { ChatHistory } from '../../../src/components/admin/ChatHistory';
import type { Insight } from '../../../src/types/assessment';
import type { DecisionTree } from '../../../src/personas/assignPersonas';

interface UserData {
  id: string;
  createdAt: string;
  updatedAt: string;
  isAdmin: boolean;
  consentStatus: boolean;
  consentDate: string | null;
}

interface AssessmentData {
  id: string;
  userId: string;
  createdAt: string;
  priorityInsight: Insight;
  additionalInsights: Insight[];
  signals: Record<string, unknown>;
  decisionTree: DecisionTree;
  isArchived: boolean;
  isFlagged: boolean;
  flaggedAt: string | null;
  flagReason: string | null;
}

export function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentData | null>(null);
  const [archivedCount, setArchivedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load user data');
      }

      const data = await response.json();
      setUser(data.user);
      setCurrentAssessment(data.currentAssessment);
      setArchivedCount(data.archivedCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleFlagAssessment = async () => {
    if (!currentAssessment) return;

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/assessments?id=${currentAssessment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFlagged: true, flagReason }),
      });

      if (!response.ok) {
        throw new Error('Failed to flag assessment');
      }

      setShowFlagModal(false);
      loadUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to flag assessment');
    }
  };

  const handleUnflagAssessment = async () => {
    if (!currentAssessment) return;

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/assessments?id=${currentAssessment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFlagged: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to unflag assessment');
      }

      loadUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unflag assessment');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading user details...</div>;
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error || 'User not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">User Detail</h1>

      {/* User Metadata */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">User Metadata</h2>
        <div className="space-y-2 text-gray-700">
          <p>
            <strong>Account ID:</strong> {user.id}
          </p>
          <p>
            <strong>Username:</strong> [MASKED]
          </p>
          <p>
            <strong>Email:</strong> [MASKED]
          </p>
          <p>
            <strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Consent Status:</strong>{' '}
            {user.consentStatus ? (
              <span className="text-green-600">
                ✅ Granted
                {user.consentDate && ` (${new Date(user.consentDate).toLocaleDateString()})`}
              </span>
            ) : (
              <span className="text-red-600">❌ Not granted</span>
            )}
          </p>
          <p>
            <strong>Admin Status:</strong> {user.isAdmin ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Archived Assessments:</strong> {archivedCount}
          </p>
        </div>
      </Card>

      {/* Current Assessment */}
      {currentAssessment ? (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Assessment</h2>
            {currentAssessment.isFlagged ? (
              <div className="flex items-center gap-2">
                <span className="text-red-600">🚩 Flagged</span>
                <Button onClick={handleUnflagAssessment} variant="outline" size="sm">
                  Unflag
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowFlagModal(true)} variant="outline" size="sm">
                Flag Assessment
              </Button>
            )}
          </div>

          {currentAssessment.isFlagged && currentAssessment.flaggedAt && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-sm text-gray-600">
                <strong>Flagged:</strong> {new Date(currentAssessment.flaggedAt).toLocaleString()}
              </p>
              {currentAssessment.flagReason && (
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Reason:</strong> {currentAssessment.flagReason}
                </p>
              )}
            </div>
          )}

          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Created: {new Date(currentAssessment.createdAt).toLocaleString()}
            </p>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Priority Insight</h3>
              <InsightCard insight={currentAssessment.priorityInsight} isPriority />
            </div>

            {currentAssessment.additionalInsights.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Additional Insights ({currentAssessment.additionalInsights.length})
                </h3>
                <div className="space-y-3">
                  {currentAssessment.additionalInsights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Decision Tree</h3>
              <DecisionTreeComponent tree={currentAssessment.decisionTree} />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Detected Signals (Raw Data)</h3>
              <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(currentAssessment.signals, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 mb-6">
          <p className="text-gray-600">No current assessment found</p>
        </Card>
      )}

      {/* Chat History */}
      <Card className="p-6 mb-6">
        <ChatHistory userId={userId!} />
      </Card>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Flag Assessment</h3>
            <p className="text-gray-700 mb-4">
              Please provide a reason for flagging this assessment:
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              rows={4}
              placeholder="Reason for flagging..."
            />
            <div className="flex gap-3">
              <Button onClick={handleFlagAssessment} className="flex-1">
                Flag Assessment
              </Button>
              <Button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
