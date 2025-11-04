/**
 * Data Ingestion Orchestrator
 *
 * Main entry point for loading and processing financial data
 */

import { UserFinancialData } from '../types/plaid';
import { DetectedSignals } from '../types/signals';
import { parseJSON } from './jsonParser';
import { validateData } from './dataValidator';
import { detectAllSignals } from '../signals';

export interface IngestOptions {
  source: 'json';
  filePath: string;
}

export interface IngestResult {
  data: UserFinancialData;
  signals: DetectedSignals;
}

export async function ingestData(options: IngestOptions): Promise<IngestResult> {
  // 1. Parse the data
  let data: UserFinancialData;

  switch (options.source) {
    case 'json':
      data = await parseJSON(options.filePath);
      break;
    default:
      throw new Error(`Unsupported source type: ${options.source}`);
  }

  // 2. Validate the data
  validateData(data);

  // 3. Detect all signals
  const signals = detectAllSignals(data);

  return {
    data,
    signals,
  };
}

export { parseJSON } from './jsonParser';
export { validateData, ValidationError } from './dataValidator';
