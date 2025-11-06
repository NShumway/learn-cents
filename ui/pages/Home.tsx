/**
 * Home Page
 *
 * Landing page with Plaid Link modal
 * Uses Plaid Link SDK for OAuth-based account connection
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaidLink } from 'react-plaid-link';
import LoadingState from '../components/plaid/LoadingState';
import ErrorState from '../components/plaid/ErrorState';
import { useAssessment } from '../hooks/useAssessment';
import { mockAssessment } from '../lib/mockAssessment';

export default function Home() {
  const navigate = useNavigate();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { error, progress, generate, reset, setProgress } = useAssessment();

  // Fetch link token on mount
  useEffect(() => {
    async function fetchLinkToken() {
      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
        });
        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (err) {
        console.error('Failed to fetch link token:', err);
      }
    }
    fetchLinkToken();
  }, []);

  // Handle Plaid Link success
  const onSuccess = async (publicToken: string) => {
    try {
      setProgress({ stage: 'Exchanging token and fetching data...', percent: 20 });

      // Exchange token and fetch data
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken }),
      });

      if (!response.ok) throw new Error('Failed to fetch data');

      const plaidData = await response.json();
      setProgress({ stage: 'Data received - preparing for analysis...', percent: 40 });

      // Generate assessment
      const assessment = await generate(plaidData);

      // Navigate to assessment page
      navigate('/assessment', { state: { assessment } });
    } catch (err) {
      console.error('Error:', err);
      reset();
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  // Fallback: use mock assessment
  const handleMockFlow = () => {
    navigate('/assessment', { state: { assessment: mockAssessment } });
  };

  if (progress.percent > 0) {
    return <LoadingState stage={progress.stage} percent={progress.percent} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reset} />;
  }

  return (
    <>
      <div className="max-w-2xl mx-auto text-center pb-24">
        <h1 className="text-4xl font-bold mb-4">Learning Cents</h1>
        <p className="text-lg text-gray-600 mb-8">
          Get personalized financial education based on your transaction data
        </p>

        <div className="mb-8 space-y-4">
          <button
            onClick={() => open()}
            disabled={!ready || !linkToken}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-md"
          >
            {ready && linkToken ? 'Connect with Plaid' : 'Loading...'}
          </button>

          <div className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <strong>Sandbox Test Credentials:</strong>
            <div className="mt-2 font-mono text-left">
              <div>
                Username: <strong>user_transactions_dynamic</strong>
              </div>
              <div>
                Password: <strong>(any value)</strong>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleMockFlow}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Or view sample assessment
            </button>
          </div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 text-left">
          <strong>Story 11.5 Complete:</strong> Click "Connect with Plaid" to open the Link modal,
          enter test credentials, and generate a personalized assessment!
        </div>
      </div>

      {/* Sticky Disclaimer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-4xl mx-auto p-4 text-sm text-gray-600">
          <strong>Disclaimer:</strong> This is educational content, not financial advice. Consult a
          licensed advisor for personalized guidance.
        </div>
      </div>
    </>
  );
}
