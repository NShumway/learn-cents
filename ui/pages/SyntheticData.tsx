/**
 * Synthetic Data Tools Page
 *
 * Generate or analyze synthetic financial data for testing
 */

import { useState } from 'react';
import GenerateDataForm from '../components/synthetic/GenerateDataForm';
import AnalyzeDataForm from '../components/synthetic/AnalyzeDataForm';

export default function SyntheticData() {
  const [activeTab, setActiveTab] = useState<'generate' | 'analyze'>('generate');

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <h1 className="text-3xl font-bold mb-2">Synthetic Data Tools</h1>
      <p className="text-gray-600 mb-8">Generate or analyze synthetic financial data for testing</p>

      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Generate Data
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analyze'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analyze Data
          </button>
        </nav>
      </div>

      {activeTab === 'generate' ? <GenerateDataForm /> : <AnalyzeDataForm />}
    </div>
  );
}
