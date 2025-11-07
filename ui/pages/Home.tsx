/**
 * Home Page
 *
 * Landing page with Plaid Link modal
 * Uses Plaid Link SDK for OAuth-based account connection
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../components/plaid/LoadingState';
import ErrorState from '../components/plaid/ErrorState';
import { useAssessment } from '../hooks/useAssessment';
import { mockAssessment } from '../lib/mockAssessment';
import { usePlaidConnection } from '../lib/plaid';
import { getAccessToken } from '../lib/auth';
import type { Assessment as AssessmentType } from '../../src/types/assessment';

export default function Home() {
  const navigate = useNavigate();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentType | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const { error, progress, generate, reset, setProgress } = useAssessment();

  // Fetch link token and current assessment on mount
  useEffect(() => {
    async function fetchLinkToken() {
      try {
        const response = await fetch('/api/plaid?action=create-link-token', {
          method: 'POST',
        });
        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (err) {
        console.error('Failed to fetch link token:', err);
      }
    }

    async function fetchCurrentAssessment() {
      try {
        const token = await getAccessToken();
        if (!token) {
          setLoadingAssessment(false);
          return;
        }

        const response = await fetch('/api/assessments?type=current', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentAssessment(data.assessment);
        }
      } catch (err) {
        console.error('Failed to fetch current assessment:', err);
      } finally {
        setLoadingAssessment(false);
      }
    }

    fetchLinkToken();
    fetchCurrentAssessment();
  }, []);

  // Handle Plaid Link success
  const onSuccess = async (publicToken: string) => {
    try {
      setProgress({ stage: 'Exchanging token and fetching data...', percent: 20 });

      // Exchange token and fetch data
      const response = await fetch('/api/plaid?action=exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken }),
      });

      if (!response.ok) throw new Error('Failed to fetch data');

      const plaidData = await response.json();
      setProgress({ stage: 'Data received - preparing for analysis...', percent: 40 });

      // Generate assessment
      const assessment = await generate(plaidData);

      // Save assessment to database
      setProgress({ stage: 'Saving your assessment...', percent: 90 });
      try {
        const token = await getAccessToken();
        if (token) {
          const saveResponse = await fetch('/api/assessments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              priorityInsight: assessment.priorityInsight,
              additionalInsights: assessment.additionalInsights,
              signals: assessment.signals,
              decisionTree: assessment.decisionTree,
            }),
          });

          if (!saveResponse.ok) {
            console.error('Failed to save assessment:', await saveResponse.text());
          } else {
            // Update current assessment state so button appears
            setCurrentAssessment(assessment);
          }
        }
      } catch (saveErr) {
        console.error('Error saving assessment:', saveErr);
        // Don't throw - still show the assessment even if save fails
      }

      setProgress({ stage: 'Complete!', percent: 100 });

      // Navigate to assessment page
      navigate('/assessment', { state: { assessment } });
    } catch (err) {
      console.error('Error:', err);
      reset();
    }
  };

  // Use the wrapper hook to avoid duplicate Plaid Link initialization
  const { open, ready } = usePlaidConnection(linkToken || '', onSuccess);

  // View saved assessment
  const handleViewAssessment = () => {
    if (currentAssessment) {
      navigate('/assessment', { state: { assessment: currentAssessment } });
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
          Discover where you can go next with personalized financial education
        </p>

        <div className="mb-8 space-y-4">
          {!loadingAssessment && currentAssessment && (
            <button
              onClick={handleViewAssessment}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md w-full sm:w-auto"
            >
              View Your Assessment
            </button>
          )}

          <button
            onClick={() => open()}
            disabled={!ready || !linkToken}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-md w-full sm:w-auto"
          >
            {ready && linkToken
              ? currentAssessment
                ? 'Create New Assessment'
                : 'Connect with Plaid'
              : 'Loading...'}
          </button>

          <div className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <strong>Sandbox Test Credentials:</strong>
            <p className="mt-2 mb-3 text-xs">
              Click the username below to copy it, then paste into Plaid Link when prompted.
            </p>
            <div className="font-mono text-left space-y-1">
              <div>
                Username:{' '}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('user_transactions_dynamic');
                  }}
                  className="font-bold hover:text-blue-600 cursor-pointer underline"
                  title="Click to copy"
                >
                  user_transactions_dynamic
                </button>
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
