/**
 * Generate Synthetic Data Form
 *
 * Allows users to generate synthetic financial data and save to file
 */

import { useState } from 'react';
import { generateSyntheticUsers } from '../../../scripts/lib/generators/userGenerator';
import { saveToFile } from '../../lib/fileSystem';

export default function GenerateDataForm() {
  const [userCount, setUserCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate synthetic users
      const users = generateSyntheticUsers(userCount);
      const dataset = {
        users,
        generated_at: new Date().toISOString(),
        count: users.length,
      };

      // Save to file using File System Access API
      await saveToFile(
        JSON.stringify(dataset, null, 2),
        `synthetic-data-${users.length}-users.json`,
        'application/json'
      );

      setSuccess(`Successfully generated ${users.length} user(s) and saved to file!`);
    } catch (err) {
      if (err instanceof Error && err.message === 'File save cancelled') {
        setError('File save cancelled');
      } else {
        console.error('Generation failed:', err);
        setError('Failed to generate data. See console for details.');
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Users</label>
        <input
          type="number"
          min="1"
          max="100"
          value={userCount}
          onChange={(e) => setUserCount(parseInt(e.target.value) || 1)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Generate 1-100 synthetic users with realistic transaction patterns
        </p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
      >
        {generating ? 'Generating...' : 'Generate & Save to File'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <strong>Success:</strong> {success}
        </div>
      )}

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
        <strong>Note:</strong> This will generate synthetic data and prompt you to save it to your
        local file system. You can then analyze this data using the "Analyze Data" tab.
      </div>
    </div>
  );
}
