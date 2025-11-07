/**
 * Assessment Display Page
 *
 * Displays the generated financial assessment with insights and decision tree
 */

import { useState, useEffect } from 'react';
import InsightCard from '../components/assessment/InsightCard';
import DecisionTreeComponent from '../components/assessment/DecisionTree';
import { mockAssessment } from '../lib/mockAssessment';
import { getAccessToken } from '../lib/auth';
import type { Assessment as AssessmentType } from '../../src/types/assessment';

export default function Assessment() {
  const [showAdditional, setShowAdditional] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssessment() {
      try {
        const token = await getAccessToken();
        if (!token) {
          setAssessment(mockAssessment);
          setLoading(false);
          return;
        }

        // Always fetch from API - it includes dynamic offer matching
        const response = await fetch('/api/assessments?type=current', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[Assessment] Loaded from API:', {
            hasAssessment: !!data.assessment,
            hasPriorityOffer: !!data.assessment?.priorityInsight?.partnerOffer,
            priorityOffer: data.assessment?.priorityInsight?.partnerOffer,
          });
          setAssessment(data.assessment);
        } else {
          setAssessment(mockAssessment);
        }
      } catch (err) {
        console.error('Failed to load assessment:', err);
        setAssessment(mockAssessment);
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-pulse">Loading your assessment...</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-600">No assessment found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto pb-24">
        <h1 className="text-3xl font-bold mb-2">Your Financial Assessment</h1>
        <p className="text-gray-600 mb-8">Personalized insights based on your transaction data</p>

        {/* Priority Insight */}
        <div className="mb-8">
          <InsightCard insight={assessment.priorityInsight} isPriority />
        </div>

        {/* Additional Insights */}
        {assessment.additionalInsights.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowAdditional(!showAdditional)}
              className="w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-left font-medium flex items-center justify-between transition-colors"
            >
              <span className="text-gray-900">
                Additional Insights ({assessment.additionalInsights.length})
              </span>
              <span className="text-gray-600">{showAdditional ? '▼' : '▶'}</span>
            </button>

            {showAdditional && (
              <div className="mt-4 space-y-4">
                {assessment.additionalInsights.map((insight, index) => (
                  <InsightCard key={index} insight={insight} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Decision Tree */}
        <div className="mb-8">
          <DecisionTreeComponent tree={assessment.decisionTree} />
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
