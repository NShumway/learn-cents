import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { getAccessToken } from '../lib/auth';

export function Settings() {
  const { user, signOut } = useAuth();
  const [consentStatus, setConsentStatus] = useState<boolean | null>(null);
  const [consentDate, setConsentDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadConsentStatus();
  }, []);

  const loadConsentStatus = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/consent/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConsentStatus(data.consentStatus);
        setConsentDate(data.consentDate ? new Date(data.consentDate) : null);
      }
    } catch (err) {
      console.error('Failed to load consent status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = async () => {
    setActionLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/consent/revoke', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to revoke consent');
      }

      setConsentStatus(false);
      setConsentDate(null);
      setShowRevokeModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke consent');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setActionLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Sign out and redirect to home
      await signOut();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Account Information */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-2 text-gray-700">
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
        </div>
      </Card>

      {/* Consent Management */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Consent Management</h2>
        <div className="space-y-4">
          {consentStatus ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-2xl">✓</span>
                <div>
                  <p className="text-gray-900 font-medium">Consent granted</p>
                  {consentDate && (
                    <p className="text-sm text-gray-600">
                      Since {consentDate.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <Button onClick={() => setShowRevokeModal(true)} variant="outline">
                Revoke Consent
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-2xl">✗</span>
                <p className="text-gray-900 font-medium">Consent not granted</p>
              </div>
              <p className="text-sm text-gray-600">
                You need to grant consent to use Learn Cents features.
              </p>
              <Button onClick={() => navigate('/consent')}>Grant Consent</Button>
            </>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Deleting your account will permanently remove all your data, including assessments and
            chat history. This action cannot be undone.
          </p>
          <Button onClick={() => setShowDeleteModal(true)} variant="secondary">
            Delete My Account and All Data
          </Button>
        </div>
      </Card>

      {/* Revoke Consent Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Revoke Consent</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to revoke consent? This will prevent future data processing.
            </p>
            <p className="text-gray-700 mb-6">
              Would you also like to delete all your existing data?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleRevokeConsent}
                disabled={actionLoading}
                variant="outline"
                className="flex-1"
              >
                Revoke Consent Only
              </Button>
              <Button
                onClick={() => {
                  setShowRevokeModal(false);
                  setShowDeleteModal(true);
                }}
                variant="secondary"
                className="flex-1"
              >
                Revoke & Delete Data
              </Button>
              <Button onClick={() => setShowRevokeModal(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-red-600 mb-4">Delete Account</h3>
            <p className="text-gray-700 mb-6">
              This will permanently delete your account and all associated data. This action cannot
              be undone.
            </p>
            <p className="text-gray-700 mb-6 font-semibold">Are you absolutely sure?</p>
            <div className="flex gap-3">
              <Button
                onClick={handleDeleteAccount}
                disabled={actionLoading}
                variant="secondary"
                className="flex-1"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete Everything'}
              </Button>
              <Button
                onClick={() => setShowDeleteModal(false)}
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
