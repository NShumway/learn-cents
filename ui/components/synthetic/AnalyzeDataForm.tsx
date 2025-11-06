/**
 * Analyze Synthetic Data Form
 *
 * Allows users to load synthetic data from file and analyze it
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadFromFile } from '../../lib/fileSystem';
import { generateAssessmentFromPlaid } from '../../lib/assessmentGenerator';
import type { SyntheticDataset } from '../../../src/types/plaid';

export default function AnalyzeDataForm() {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      // Load file using File System Access API
      const fileContent = await loadFromFile('.json');
      const dataset: SyntheticDataset = JSON.parse(fileContent);

      // Validate structure
      if (!dataset.users || dataset.users.length === 0) {
        throw new Error('Invalid data structure: No users found');
      }

      // Use ONLY the first user (UI processes single records only)
      const user = dataset.users[0];
      const userData = {
        accounts: user.accounts,
        transactions: user.transactions,
        liabilities: user.liabilities,
      };

      console.log(`Analyzing first user: ${user.name.first} ${user.name.last}`);
      if (dataset.users.length > 1) {
        console.log(
          `Note: File contains ${dataset.users.length} users, processing only the first one`
        );
      }

      // Generate assessment
      const assessment = await generateAssessmentFromPlaid(userData);

      // Navigate to assessment page
      navigate('/assessment', { state: { assessment } });
    } catch (err) {
      if (err instanceof Error && err.message === 'File selection cancelled') {
        setError('File selection cancelled');
      } else {
        console.error('Analysis failed:', err);
        setError(`Failed to analyze data: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-700 mb-4">
          Load a synthetic data file (JSON) to analyze the first user's financial data and generate
          a personalized assessment.
        </p>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={analyzing}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
      >
        {analyzing ? 'Analyzing...' : 'Load & Analyze File'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
        <strong>Single Record Processing:</strong> If your file contains multiple users, only the
        first user will be analyzed. Use CLI tools for batch processing.
      </div>
    </div>
  );
}
