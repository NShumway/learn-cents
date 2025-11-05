/**
 * Assessment Display Page
 *
 * Displays the generated financial assessment with insights and decision tree
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import InsightCard from '../components/assessment/InsightCard';
import DecisionTreeComponent from '../components/assessment/DecisionTree';
import { mockAssessment } from '../lib/mockAssessment';
import type { Assessment as AssessmentType } from '../../src/types/assessment';

export default function Assessment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAdditional, setShowAdditional] = useState(false);

  // Get assessment from navigation state or fall back to mock
  const assessment: AssessmentType =
    (location.state as { assessment?: AssessmentType })?.assessment || mockAssessment;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Your Financial Assessment</h1>
      <p className="text-gray-600 mb-8">
        Personalized insights based on your transaction data
      </p>

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

      {/* Disclaimer */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
        <strong>Disclaimer:</strong> This is educational content, not financial advice. Consult a
        licensed advisor for personalized guidance.
      </div>
    </div>
  );
}
