/**
 * Synthetic Data Tools Page
 *
 * Generate or analyze synthetic financial data for testing
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSyntheticUsers } from '../../scripts/lib/generators/userGenerator';
import { loadFromFile, saveToFile } from '../lib/fileSystem';
import { useAssessment } from '../hooks/useAssessment';
import LoadingState from '../components/plaid/LoadingState';
import ErrorState from '../components/plaid/ErrorState';
import type { SyntheticDataset } from '../../src/types/plaid';

export default function SyntheticData() {
  const navigate = useNavigate();
  const { loading, error, progress, generate, reset } = useAssessment();
  const [generating, setGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateStatus(null);
    try {
      // Generate single synthetic user
      const users = generateSyntheticUsers(1);
      const dataset = {
        users,
        generated_at: new Date().toISOString(),
        count: 1,
      };

      // Save to file using File System Access API
      await saveToFile(
        JSON.stringify(dataset, null, 2),
        `synthetic-data-${new Date().toISOString().split('T')[0]}.json`,
        'application/json'
      );

      setGenerateStatus({
        type: 'success',
        message: 'Synthetic data generated and saved successfully!',
      });
      setTimeout(() => setGenerateStatus(null), 5000);
    } catch (error) {
      console.error('Generation failed:', error);
      setGenerateStatus({
        type: 'error',
        message: 'Failed to generate data. See console for details.',
      });
      setTimeout(() => setGenerateStatus(null), 5000);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      // Load file using File System Access API
      const fileContent = await loadFromFile('.json');
      const dataset: SyntheticDataset = JSON.parse(fileContent);

      // Validate structure
      if (!dataset.users || dataset.users.length === 0) {
        throw new Error('Invalid data structure: No users found');
      }

      // Use ONLY the first user
      const user = dataset.users[0];
      const userData = {
        accounts: user.accounts,
        transactions: user.transactions,
        liabilities: user.liabilities,
      };

      console.log(`Analyzing user: ${user.name.first} ${user.name.last}`);
      if (dataset.users.length > 1) {
        console.log(
          `Note: File contains ${dataset.users.length} users, processing only the first one`
        );
      }

      // Generate assessment
      const assessment = await generate(userData);

      // Navigate to assessment page
      navigate('/assessment', { state: { assessment } });
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze data. See console for details.');
    }
  };

  if (loading) {
    return <LoadingState stage={progress.stage} percent={progress.percent} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reset} />;
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <h1 className="text-3xl font-bold mb-2">Synthetic Data Tools</h1>
      <p className="text-gray-600 mb-8">Generate or analyze synthetic financial data for testing</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generate Button */}
        <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
          <h2 className="text-xl font-semibold mb-3">Generate Synthetic Data</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Create a realistic synthetic user with transactions, accounts, and spending patterns.
            Save to your local file system for later analysis.
          </p>

          {generateStatus && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                generateStatus.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {generateStatus.message}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {generating ? 'Generating...' : 'Generate & Save'}
          </button>
        </div>

        {/* Analyze Button */}
        <div className="border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors">
          <h2 className="text-xl font-semibold mb-3">Analyze Synthetic Data</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Load a previously generated synthetic data file and run the assessment engine to see
            personalized insights and recommendations.
          </p>
          <button
            onClick={handleAnalyze}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Load & Analyze
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
        <strong>Note:</strong> The UI processes single-user data only. For batch processing of
        multiple users, use the CLI tools (
        <code className="text-xs bg-gray-200 px-1 rounded">npm run generate:data</code> and{' '}
        <code className="text-xs bg-gray-200 px-1 rounded">npm run run:assessment</code>).
      </div>
    </div>
  );
}
