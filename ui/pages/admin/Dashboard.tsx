import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getAccessToken } from '../../lib/auth';

interface User {
  id: string;
  createdAt: string;
  consentStatus: boolean;
  isAdmin: boolean;
  _count: {
    assessments: number;
  };
}

interface FlaggedAssessment {
  id: string;
  userId: string;
  createdAt: string;
  flaggedAt: string;
  flagReason: string | null;
  user: {
    id: string;
    createdAt: string;
  };
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [flaggedAssessments, setFlaggedAssessments] = useState<FlaggedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await getAccessToken();

      const [usersResponse, flaggedResponse] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/flagged', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!usersResponse.ok || !flaggedResponse.ok) {
        throw new Error('Failed to load admin data');
      }

      const usersData = await usersResponse.json();
      const flaggedData = await flaggedResponse.json();

      setUsers(usersData.users);
      setFlaggedAssessments(flaggedData.flaggedAssessments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading admin dashboard...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Flagged Insights Section */}
      {flaggedAssessments.length > 0 && (
        <Card className="p-6 mb-8 border-red-200">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            Flagged Insights ({flaggedAssessments.length})
          </h2>
          <div className="space-y-3">
            {flaggedAssessments.map((assessment) => (
              <Link
                key={assessment.id}
                to={`/admin/users/${assessment.userId}`}
                className="block p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Account ID: {assessment.userId.substring(0, 8)}...
                    </p>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(assessment.createdAt).toLocaleDateString()} | Flagged:{' '}
                      {new Date(assessment.flaggedAt).toLocaleDateString()}
                    </p>
                    {assessment.flagReason && (
                      <p className="text-sm text-gray-700 mt-1">Reason: {assessment.flagReason}</p>
                    )}
                  </div>
                  <span className="text-2xl">🚩</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Insights Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Recent Users ({users.length})</h2>
        <div className="space-y-3">
          {users.slice(0, 20).map((user) => {
            const isFlagged = flaggedAssessments.some((a) => a.userId === user.id);
            return (
              <Link
                key={user.id}
                to={`/admin/users/${user.id}`}
                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Account ID: {user.id.substring(0, 8)}... {isFlagged && '🚩'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(user.createdAt).toLocaleDateString()} | Consent:{' '}
                      {user.consentStatus ? '✅' : '❌'} | Assessments: {user._count.assessments}
                      {user.isAdmin && ' | Admin'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </Link>
            );
          })}
        </div>
        {users.length > 20 && (
          <p className="text-sm text-gray-600 mt-4 text-center">
            Showing 20 of {users.length} users
          </p>
        )}
      </Card>
    </div>
  );
}
