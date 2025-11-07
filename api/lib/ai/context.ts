import type { Assessment } from '@prisma/client';

/**
 * Build AI context from assessment data
 * CRITICAL: Only send assessment data structures, NEVER raw Plaid data
 */
export function buildAIContext(assessment: Assessment) {
  // Assessment data is stored as JSONB in Prisma
  const priorityInsight = assessment.priorityInsight as any;
  const additionalInsights = assessment.additionalInsights as any[];

  // Extract eligibility metrics if available
  const eligibilityMetrics = (assessment as any).eligibilityMetrics || null;

  return {
    priorityInsight,
    additionalInsights,
    eligibilityMetrics,
  };
}

/**
 * Sanitize context to ensure no PII leaks
 */
export function sanitizeContext(context: any): any {
  // Remove any fields that might contain PII
  const sanitized = JSON.parse(JSON.stringify(context));

  // Recursively remove sensitive fields
  function removeSensitiveFields(obj: any) {
    if (typeof obj !== 'object' || obj === null) return;

    delete obj.accountId;
    delete obj.accountNumber;
    delete obj.username;
    delete obj.email;
    delete obj.phone;
    delete obj.ssn;

    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        removeSensitiveFields(obj[key]);
      }
    }
  }

  removeSensitiveFields(sanitized);
  return sanitized;
}
