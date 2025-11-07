import type { Assessment } from '@prisma/client';
import type { Prisma } from '@prisma/client';

interface AssessmentInsight {
  type: string;
  severity?: string;
  [key: string]: unknown;
}

interface EligibilityMetrics {
  [key: string]: unknown;
}

interface AssessmentWithMetrics extends Assessment {
  eligibilityMetrics?: Prisma.JsonValue;
}

/**
 * Build AI context from assessment data
 * CRITICAL: Only send assessment data structures, NEVER raw Plaid data
 */
export function buildAIContext(assessment: Assessment) {
  // Assessment data is stored as JSONB in Prisma
  const priorityInsight = assessment.priorityInsight as AssessmentInsight;
  const additionalInsights = assessment.additionalInsights as AssessmentInsight[];

  // Extract eligibility metrics if available
  const eligibilityMetrics = (assessment as AssessmentWithMetrics).eligibilityMetrics as
    | EligibilityMetrics
    | undefined;

  return {
    priorityInsight,
    additionalInsights,
    eligibilityMetrics,
  };
}

/**
 * Sanitize context to ensure no PII leaks
 */
export function sanitizeContext<T extends Record<string, unknown>>(context: T): T {
  // Remove any fields that might contain PII
  const sanitized = JSON.parse(JSON.stringify(context)) as T;

  // Recursively remove sensitive fields
  function removeSensitiveFields(obj: Record<string, unknown>) {
    if (typeof obj !== 'object' || obj === null) return;

    delete obj.accountId;
    delete obj.accountNumber;
    delete obj.username;
    delete obj.email;
    delete obj.phone;
    delete obj.ssn;

    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        removeSensitiveFields(obj[key] as Record<string, unknown>);
      }
    }
  }

  removeSensitiveFields(sanitized as Record<string, unknown>);
  return sanitized;
}
