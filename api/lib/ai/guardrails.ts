/**
 * Prompt-based guardrails with post-validation
 */

const PROHIBITED_PHRASES = [
  'you should invest',
  'you must',
  'i recommend investing',
  'buy stocks',
  'sell your',
  'transfer your money',
  'withdraw from',
  'you need to',
  'the best option is',
];

const ADVICE_INDICATORS = [
  'should do',
  'must do',
  'have to',
  'need to immediately',
  'recommend that you',
];

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  modifiedContent?: string;
}

/**
 * Validate AI response content before streaming to user
 */
export function validateResponse(content: string): ValidationResult {
  const issues: string[] = [];
  const lowerContent = content.toLowerCase();

  // Check for prohibited phrases (regulated advice)
  for (const phrase of PROHIBITED_PHRASES) {
    if (lowerContent.includes(phrase)) {
      issues.push(`Contains prohibited phrase: "${phrase}"`);
    }
  }

  // Check for advice indicators (should be educational, not directive)
  for (const indicator of ADVICE_INDICATORS) {
    if (lowerContent.includes(indicator)) {
      issues.push(`Contains advice indicator: "${indicator}"`);
    }
  }

  // Check if disclaimer is included when discussing financial topics
  const financialKeywords = ['credit', 'debt', 'savings', 'invest', 'loan', 'budget'];
  const hasFinancialContent = financialKeywords.some((keyword) => lowerContent.includes(keyword));
  const hasDisclaimer =
    lowerContent.includes('not financial advice') ||
    lowerContent.includes('consult a licensed') ||
    lowerContent.includes('educational content');

  if (hasFinancialContent && !hasDisclaimer) {
    // Auto-inject disclaimer
    const modifiedContent =
      content +
      '\n\n*This is educational content, not financial advice. Consult a licensed financial advisor for personalized guidance.*';
    return {
      isValid: true,
      issues: [],
      modifiedContent,
    };
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Validate user input before sending to AI
 */
export function validateUserMessage(message: string): ValidationResult {
  const issues: string[] = [];

  // Check for attempts to inject system prompts
  if (
    message.toLowerCase().includes('ignore previous') ||
    message.toLowerCase().includes('disregard instructions')
  ) {
    issues.push('Message contains prompt injection attempt');
  }

  // Check for PII that shouldn't be shared
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
  const accountPattern = /\b\d{10,17}\b/;

  if (ssnPattern.test(message)) {
    issues.push('Message contains SSN pattern');
  }

  if (accountPattern.test(message)) {
    issues.push('Message may contain account number');
  }

  // Length check
  if (message.length > 2000) {
    issues.push('Message exceeds maximum length (2000 characters)');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
