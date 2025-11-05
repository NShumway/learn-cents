/**
 * Home Page
 *
 * Landing page with Plaid connection flow
 * Note: Currently using mock data since Plaid server-side integration
 * will be implemented in Phase 4. The UI flow is complete.
 */

import { useNavigate } from 'react-router-dom';
import PlaidConnectButton from '../components/plaid/PlaidConnectButton';
import LoadingState from '../components/plaid/LoadingState';
import ErrorState from '../components/plaid/ErrorState';
import { useAssessment } from '../hooks/useAssessment';
import { exchangePublicToken, fetchPlaidData } from '../lib/plaid';
import { mockAssessment } from '../lib/mockAssessment';
import { SANDBOX_LINK_TOKEN } from '../config/plaid';
import type { PlaidLinkOnSuccess } from 'react-plaid-link';

export default function Home() {
  const navigate = useNavigate();
  const { loading, error, progress, reset } = useAssessment();

  const handlePlaidSuccess: PlaidLinkOnSuccess = async (publicToken, metadata) => {
    try {
      // Exchange public token for access token (stub for now)
      const accessToken = await exchangePublicToken(publicToken);

      // Fetch Plaid data (stub - will throw error for now)
      // In Phase 4, this will actually fetch from server
      // const plaidData = await fetchPlaidData(accessToken);
      // await generate(plaidData);

      // For now, use mock assessment and navigate directly
      console.log('Access token:', accessToken);
      console.log('Metadata:', metadata);

      // Navigate to assessment with mock data
      // In Phase 4, this will use real generated assessment
      navigate('/assessment', { state: { assessment: mockAssessment } });
    } catch (err) {
      console.error('Plaid connection failed:', err);
      // Show error - but for Phase 3 demo, we'll just use mock data anyway
      navigate('/assessment', { state: { assessment: mockAssessment } });
    }
  };

  // Simulate mock flow without Plaid for demo purposes
  const handleMockFlow = () => {
    navigate('/assessment', { state: { assessment: mockAssessment } });
  };

  if (loading) {
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
          {SANDBOX_LINK_TOKEN ? (
            <>
              <PlaidConnectButton
                linkToken={SANDBOX_LINK_TOKEN}
                onSuccess={handlePlaidSuccess}
              />
              <div className="text-sm text-gray-500">
                <strong>Note:</strong> This demo uses Plaid Sandbox mode. Use test
                credentials to connect.
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleMockFlow}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                View Sample Assessment
              </button>
              <div className="text-sm text-gray-500">
                <strong>Note:</strong> Plaid Link Token not configured. Click to view
                sample assessment with mock data.
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 text-left">
          <strong>Phase 3 Status:</strong> UI components complete. Server-side Plaid
          integration (token exchange, data fetching) will be implemented in Phase 4.
        </div>
      </div>

      {/* Sticky Disclaimer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-4xl mx-auto p-4 text-sm text-gray-600">
          <strong>Disclaimer:</strong> This is educational content, not financial
          advice. Consult a licensed advisor for personalized guidance.
        </div>
      </div>
    </>
  );
}
