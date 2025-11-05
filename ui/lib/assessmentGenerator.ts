/**
 * Client-side Assessment Generation
 *
 * Uses Phase 2 functions to process Plaid data in the browser.
 * Raw financial data is flushed immediately after processing.
 */

import { detectAllSignals } from '../../src/signals';
import { assignPersona } from '../../src/personas';
import { buildAssessment } from '../../src/assessment/buildAssessment';
import type { UserFinancialData } from '../../src/types/plaid';
import type { Assessment } from '../../src/types/assessment';

/**
 * Generate assessment from Plaid data (client-side)
 *
 * Pipeline:
 * 1. Detect signals
 * 2. Assign personas
 * 3. Build assessment
 * 4. FLUSH raw financial data
 * 5. Return only assessment
 *
 * @param plaidData - Financial data from Plaid
 * @param onProgress - Optional progress callback
 * @returns Complete assessment ready for display
 */
export async function generateAssessmentFromPlaid(
  plaidData: UserFinancialData,
  onProgress?: (stage: string, percent: number) => void
): Promise<Assessment> {
  try {
    // Stage 1: Detect signals
    onProgress?.('Analyzing patterns', 30);
    const signals = detectAllSignals(plaidData);
    onProgress?.('Patterns detected', 60);

    // Stage 2: Assign personas
    onProgress?.('Identifying insights', 70);
    const personaResult = assignPersona(signals);
    onProgress?.('Insights identified', 80);

    // Stage 3: Build assessment
    onProgress?.('Generating recommendations', 85);
    const assessment = buildAssessment(personaResult, signals);
    onProgress?.('Assessment complete', 95);

    // Stage 4: FLUSH raw data from memory
    // This ensures raw financial data doesn't stay in browser memory
    plaidData.accounts.length = 0;
    plaidData.transactions.length = 0;
    plaidData.liabilities.length = 0;

    onProgress?.('Finalizing', 100);

    return assessment;
  } catch (error) {
    console.error('Assessment generation failed:', error);
    throw error;
  }
}
