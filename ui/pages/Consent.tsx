import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { getAccessToken } from '../lib/auth';

export function Consent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGrantConsent = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/consent/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to grant consent');
      }

      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant consent');
    } finally {
      setLoading(false);
    }
  };

  const handleDenyConsent = () => {
    // If user denies consent, they can't use the app
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy & Consent</h1>
          <p className="text-gray-600">
            Before you can use Learn Cents, we need your consent to process your financial data.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What we collect and store:</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                <strong>Assessment data:</strong> We store your financial insights, persona
                assignments, and educational recommendations based on your Plaid data.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                <strong>Eligibility metrics:</strong> Aggregated metrics used to match you with
                appropriate financial products.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                <strong>Decision trees:</strong> Explanations of how your persona was assigned.
              </span>
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">What we DO NOT store:</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>
                <strong>Raw financial data:</strong> All Plaid transaction and account data is
                processed in your browser and never sent to our servers.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>
                <strong>Plaid access tokens:</strong> These remain in your browser session only.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Your rights:</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-gray-600 mr-2">•</span>
              <span>You can revoke consent at any time from your Settings page</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-600 mr-2">•</span>
              <span>You can delete all your data at any time</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-600 mr-2">•</span>
              <span>Revoking consent will block future data processing</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-4">
          <Button onClick={handleGrantConsent} disabled={loading} className="flex-1">
            {loading ? 'Processing...' : 'I Consent - Continue to Learn Cents'}
          </Button>
          <Button onClick={handleDenyConsent} variant="outline" className="flex-1">
            Deny - Return to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
