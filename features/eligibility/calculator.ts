import type { DetectedSignals } from '../../src/types/signals';
import type { EligibilityMetrics } from './types';

export function calculateEligibilityMetrics(signals: DetectedSignals): EligibilityMetrics {
  // Credit metrics - use 180d window for historical view
  const creditEvidence = signals.credit['180d'].evidence;
  const creditAccounts = creditEvidence.accounts;

  const creditUtilizations = creditAccounts.map((c) => c.utilizationPercent);
  const maxCreditUtilization = creditUtilizations.length > 0 ? Math.max(...creditUtilizations) : 0;
  const avgCreditUtilization =
    creditUtilizations.length > 0
      ? creditUtilizations.reduce((a, b) => a + b, 0) / creditUtilizations.length
      : 0;

  const totalCreditBalance = creditAccounts.reduce((sum, c) => sum + c.balance, 0);
  const totalCreditLimit = creditAccounts.reduce((sum, c) => sum + c.limit, 0);
  const totalInterestPaid = creditAccounts.filter((c) => c.hasInterestCharges).length * 50; // Estimate

  // Savings metrics - use 180d window
  const savingsAccounts = signals.savings['180d'].evidence.accounts;
  const totalSavingsBalance = savingsAccounts.reduce((sum, s) => sum + s.endBalance, 0);

  // Emergency fund coverage in months
  const monthlyExpenses = estimateMonthlyExpenses(signals);
  const emergencyFundCoverage = monthlyExpenses > 0 ? totalSavingsBalance / monthlyExpenses : 0;

  // Income metrics - use 180d window
  const incomeEvidence = signals.income['180d'].evidence;
  const estimatedMonthlyIncome = incomeEvidence.averageIncome;
  const incomeStability: 'stable' | 'variable' | 'unknown' =
    incomeEvidence.frequency === 'irregular' ? 'variable' : 'stable';

  // Existing accounts
  const hasCreditCard = creditAccounts.length > 0;
  const hasSavingsAccount = savingsAccounts.length > 0;

  // Note: These would need to be detected from account types
  const hasCheckingAccount = true; // Assume checking for now
  const hasMoneyMarket = false; // Would need Plaid account subtype detection
  const hasHSA = false; // Would need Plaid account subtype detection

  return {
    maxCreditUtilization,
    avgCreditUtilization,
    totalCreditBalance,
    totalCreditLimit,
    totalInterestPaid,
    totalSavingsBalance,
    emergencyFundCoverage,
    estimatedMonthlyIncome,
    incomeStability,
    hasCheckingAccount,
    hasSavingsAccount,
    hasCreditCard,
    hasMoneyMarket,
    hasHSA,
  };
}

function estimateMonthlyExpenses(signals: DetectedSignals): number {
  // Simple estimation: sum of subscriptions + average discretionary spending
  const subscriptions = signals.subscriptions['180d'].evidence.subscriptions;
  const subscriptionTotal = subscriptions.reduce((sum, s) => {
    const monthly =
      s.cadence === 'weekly' ? s.amount * 4 : s.cadence === 'biweekly' ? s.amount * 2 : s.amount;
    return sum + monthly;
  }, 0);

  // Could add more sophisticated expense tracking here
  // For now, estimate based on income and savings
  const incomeEvidence = signals.income['180d'].evidence;
  const estimatedExpenses = Math.max(
    subscriptionTotal,
    incomeEvidence.averageIncome * 0.7 // Assume 70% of income goes to expenses
  );

  return estimatedExpenses;
}
