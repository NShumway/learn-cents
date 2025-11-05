/**
 * Home Page
 *
 * Landing page with Plaid Sandbox connection
 * Connects to Plaid Sandbox and generates real assessment from transaction data
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../components/plaid/LoadingState';
import ErrorState from '../components/plaid/ErrorState';
import { useAssessment } from '../hooks/useAssessment';
import { connectSandboxAccount } from '../lib/plaid';
import { mockAssessment } from '../lib/mockAssessment';

export default function Home() {
  const navigate = useNavigate();
  const { loading, error, progress, generate, reset, setProgress } = useAssessment();

  const handleConnectPlaid = async () => {
    try {
      setProgress({ stage: 'Connecting to Plaid Sandbox...', percent: 5 });
      console.log('🔗 Connecting to Plaid Sandbox...');

      // Fetch financial data from Plaid Sandbox (bypasses UI, creates sandbox item directly)
      setProgress({ stage: 'Fetching account and transaction data from Plaid Sandbox...', percent: 15 });
      const plaidData = await connectSandboxAccount();

      setProgress({ stage: 'Data received - preparing for analysis...', percent: 40 });
      console.log('✓ Received financial data:', {
        accounts: plaidData.accounts.length,
        transactions: plaidData.transactions.length,
        liabilities: plaidData.liabilities.length,
      });

      // Small delay to show the transition
      await new Promise(resolve => setTimeout(resolve, 300));

      // Generate assessment client-side using Phase 2 functions
      // The generate function will update progress from 40-100%
      const assessment = await generate(plaidData);
      console.log('✓ Assessment generated successfully:', assessment);

      // Navigate to assessment page with generated assessment
      navigate('/assessment', { state: { assessment } });
    } catch (err) {
      console.error('❌ Plaid connection failed:', err);
      reset();
      // Error will be shown via ErrorState component
      throw err; // Re-throw to trigger error state
    }
  };

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
            onClick={handleConnectPlaid}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            Connect with Plaid
          </button>
          <div className="text-sm text-gray-500">
            <strong>Demo Mode:</strong> Connects to Plaid Sandbox and generates a real assessment from transaction data
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
          <strong>Story 11 Complete:</strong> Click "Connect with Plaid" to fetch real Plaid Sandbox data and generate a personalized assessment using your Phase 2 engine!
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
