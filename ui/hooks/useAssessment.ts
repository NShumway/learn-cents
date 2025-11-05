/**
 * useAssessment Hook
 *
 * Manages assessment state and generation process
 */

import { useState } from 'react';
import type { Assessment } from '../../src/types/assessment';
import type { UserFinancialData } from '../../src/types/plaid';
import { generateAssessmentFromPlaid } from '../lib/assessmentGenerator';

interface UseAssessmentReturn {
  assessment: Assessment | null;
  loading: boolean;
  error: Error | null;
  progress: { stage: string; percent: number };
  generate: (plaidData: UserFinancialData) => Promise<Assessment>;
  setProgress: (progress: { stage: string; percent: number }) => void;
  reset: () => void;
}

export function useAssessment(): UseAssessmentReturn {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState({ stage: '', percent: 0 });

  const generate = async (plaidData: UserFinancialData): Promise<Assessment> => {
    setLoading(true);
    setError(null);
    setProgress({ stage: 'Starting', percent: 0 });

    try {
      const result = await generateAssessmentFromPlaid(
        plaidData,
        (stage, percent) => setProgress({ stage, percent })
      );

      setAssessment(result);
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Assessment generation failed')
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAssessment(null);
    setError(null);
    setProgress({ stage: '', percent: 0 });
  };

  return { assessment, loading, error, progress, generate, setProgress, reset };
}
