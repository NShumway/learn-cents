/**
 * Persona Matching Criteria
 *
 * Implements the formulas defined in docs/persona-assignment.md
 * for each of the 7 personas.
 */

import { DetectedSignals } from '../types/signals';
import { PersonaType } from '../types/persona';
import { DecisionNode } from './assignPersonas';

/**
 * 1. Overdraft-Vulnerable
 *
 * Formula: count30d >= 1 OR count180d >= 2
 */
export function checkOverdraftVulnerable(signals: DetectedSignals): DecisionNode {
  const criteria: string[] = [];
  const evidence: Record<string, any> = {};

  const overdraft30d = signals.overdrafts['30d'];
  const overdraft180d = signals.overdrafts['180d'];

  let matched = false;

  if (overdraft30d.detected && overdraft30d.evidence.count30d >= 1) {
    criteria.push(`${overdraft30d.evidence.count30d} overdraft(s) in last 30 days`);
    evidence.count30d = overdraft30d.evidence.count30d;
    evidence.incidents30d = overdraft30d.evidence.incidents;
    matched = true;
  }

  if (overdraft180d.detected && overdraft180d.evidence.count180d >= 2) {
    criteria.push(`${overdraft180d.evidence.count180d} overdraft(s) in last 180 days`);
    evidence.count180d = overdraft180d.evidence.count180d;
    evidence.incidents180d = overdraft180d.evidence.incidents;
    matched = true;
  }

  if (matched && overdraft180d.evidence.totalFees > 0) {
    criteria.push(`$${overdraft180d.evidence.totalFees.toFixed(2)} in fees`);
    evidence.totalFees = overdraft180d.evidence.totalFees;
  }

  return {
    persona: 'overdraft_vulnerable',
    checked: true,
    matched,
    criteria,
    evidence,
  };
}

/**
 * 2. High Utilization
 *
 * Formula: ANY account with:
 *   - utilizationBucket === '50_to_80' OR 'over_80'
 *   - OR hasInterestCharges === true
 *   - OR minimumPaymentOnly === true
 *   - OR isOverdue === true
 */
export function checkHighUtilization(signals: DetectedSignals): DecisionNode {
  const criteria: string[] = [];
  const evidence: Record<string, any> = {};

  const credit30d = signals.credit['30d'];
  let matched = false;

  if (!credit30d.detected) {
    return {
      persona: 'high_utilization',
      checked: true,
      matched: false,
      criteria: ['No credit accounts detected'],
      evidence: {},
    };
  }

  const problematicAccounts = credit30d.evidence.accounts.filter((acc) => {
    return (
      acc.utilizationBucket === '50_to_80' ||
      acc.utilizationBucket === 'over_80' ||
      acc.hasInterestCharges ||
      acc.minimumPaymentOnly ||
      acc.isOverdue
    );
  });

  if (problematicAccounts.length > 0) {
    matched = true;

    // Track high utilization accounts
    const highUtilAccounts = problematicAccounts.filter(
      (acc) => acc.utilizationBucket === '50_to_80' || acc.utilizationBucket === 'over_80'
    );
    if (highUtilAccounts.length > 0) {
      const maxUtil = Math.max(...highUtilAccounts.map((a) => a.utilizationPercent));
      criteria.push(
        `${highUtilAccounts.length} card(s) with 50%+ utilization (max: ${maxUtil.toFixed(0)}%)`
      );
      evidence.highUtilizationAccounts = highUtilAccounts.map((a) => ({
        mask: a.mask,
        utilization: a.utilizationPercent,
        bucket: a.utilizationBucket,
      }));
    }

    // Track interest charges
    const interestAccounts = problematicAccounts.filter((acc) => acc.hasInterestCharges);
    if (interestAccounts.length > 0) {
      criteria.push(`${interestAccounts.length} card(s) carrying interest charges`);
      evidence.hasInterestCharges = true;
    }

    // Track minimum payment only
    const minPaymentAccounts = problematicAccounts.filter((acc) => acc.minimumPaymentOnly);
    if (minPaymentAccounts.length > 0) {
      criteria.push(`${minPaymentAccounts.length} card(s) with minimum payment only`);
      evidence.minimumPaymentOnly = true;
    }

    // Track overdue
    const overdueAccounts = problematicAccounts.filter((acc) => acc.isOverdue);
    if (overdueAccounts.length > 0) {
      criteria.push(`${overdueAccounts.length} overdue card(s)`);
      evidence.hasOverdue = true;
    }

    evidence.accountsAffected = problematicAccounts.length;
    evidence.totalBalance = problematicAccounts.reduce((sum, a) => sum + a.balance, 0);
    evidence.overallUtilization = credit30d.evidence.overallUtilization.percent;
  }

  return {
    persona: 'high_utilization',
    checked: true,
    matched,
    criteria,
    evidence,
  };
}

/**
 * 3. Variable-Income Budgeter
 *
 * Formula: medianPayGap > 45 AND cashFlowBuffer < 1
 */
export function checkVariableIncomeBudgeter(signals: DetectedSignals): DecisionNode {
  const criteria: string[] = [];
  const evidence: Record<string, any> = {};

  const income180d = signals.income['180d'];
  let matched = false;

  if (!income180d.detected) {
    return {
      persona: 'variable_income_budgeter',
      checked: true,
      matched: false,
      criteria: ['No income detected'],
      evidence: {},
    };
  }

  const { medianPayGap, cashFlowBuffer } = income180d.evidence;

  if (medianPayGap > 45 && cashFlowBuffer < 1) {
    matched = true;
    criteria.push(`Median pay gap of ${medianPayGap.toFixed(0)} days (>45 days)`);
    criteria.push(
      `Cash flow buffer of ${cashFlowBuffer.toFixed(1)} months (<1 month)`
    );
    evidence.medianPayGap = medianPayGap;
    evidence.cashFlowBuffer = cashFlowBuffer;
    evidence.frequency = income180d.evidence.frequency;
    evidence.averageIncome = income180d.evidence.averageIncome;

    // Mark as borderline if close to threshold
    if (medianPayGap < 50 || cashFlowBuffer > 0.8) {
      evidence.borderline = true;
    }
  }

  return {
    persona: 'variable_income_budgeter',
    checked: true,
    matched,
    criteria,
    evidence,
  };
}

/**
 * 4. Subscription-Heavy
 *
 * Formula: subscriptions.length >= 3 AND (
 *   totalMonthlySpend >= 50 (in 30d window) OR
 *   subscriptionShareOfSpend >= 10 (percentage)
 * )
 */
export function checkSubscriptionHeavy(signals: DetectedSignals): DecisionNode {
  const criteria: string[] = [];
  const evidence: Record<string, any> = {};

  const subscriptions30d = signals.subscriptions['30d'];
  let matched = false;

  if (!subscriptions30d.detected) {
    return {
      persona: 'subscription_heavy',
      checked: true,
      matched: false,
      criteria: ['No subscriptions detected'],
      evidence: {},
    };
  }

  const { subscriptions, totalMonthlySpend, subscriptionShareOfSpend } =
    subscriptions30d.evidence;

  if (
    subscriptions.length >= 3 &&
    (totalMonthlySpend >= 50 || subscriptionShareOfSpend >= 10)
  ) {
    matched = true;
    criteria.push(`${subscriptions.length} recurring subscriptions detected`);

    if (totalMonthlySpend >= 50) {
      criteria.push(`$${totalMonthlySpend.toFixed(2)}/month total spend`);
    }

    if (subscriptionShareOfSpend >= 10) {
      criteria.push(`${subscriptionShareOfSpend.toFixed(1)}% of total spending`);
    }

    evidence.subscriptionCount = subscriptions.length;
    evidence.totalMonthlySpend = totalMonthlySpend;
    evidence.subscriptionShareOfSpend = subscriptionShareOfSpend;
    evidence.subscriptions = subscriptions.map((s) => ({
      merchant: s.merchant,
      amount: s.amount,
      cadence: s.cadence,
    }));

    // Mark as borderline if just meeting threshold
    if (subscriptions.length === 3 && totalMonthlySpend < 60 && subscriptionShareOfSpend < 12) {
      evidence.borderline = true;
    }
  }

  return {
    persona: 'subscription_heavy',
    checked: true,
    matched,
    criteria,
    evidence,
  };
}

/**
 * 5. Savings Builder
 *
 * Formula: (growthRate >= 2 OR netInflow >= 200/month) AND
 *          overallUtilization.bucket === 'under_30'
 */
export function checkSavingsBuilder(signals: DetectedSignals): DecisionNode {
  const criteria: string[] = [];
  const evidence: Record<string, any> = {};

  const savings180d = signals.savings['180d'];
  const credit30d = signals.credit['30d'];
  let matched = false;

  if (!savings180d.detected) {
    return {
      persona: 'savings_builder',
      checked: true,
      matched: false,
      criteria: ['No savings activity detected'],
      evidence: {},
    };
  }

  // Check if any account has positive growth or inflow
  const positiveAccounts = savings180d.evidence.accounts.filter(
    (acc) => acc.growthRate >= 2 || acc.netInflow >= 200
  );

  // Check overall credit utilization
  const creditUtilOk =
    !credit30d.detected || credit30d.evidence.overallUtilization.bucket === 'under_30';

  if (positiveAccounts.length > 0 && creditUtilOk) {
    matched = true;

    const growthAccounts = positiveAccounts.filter((acc) => acc.growthRate >= 2);
    if (growthAccounts.length > 0) {
      const maxGrowth = Math.max(...growthAccounts.map((a) => a.growthRate));
      criteria.push(`Savings growth of ${maxGrowth.toFixed(1)}% (≥2%)`);
    }

    const inflowAccounts = positiveAccounts.filter((acc) => acc.netInflow >= 200);
    if (inflowAccounts.length > 0) {
      const totalInflow = inflowAccounts.reduce((sum, a) => sum + a.netInflow, 0);
      criteria.push(`Net inflow of $${totalInflow.toFixed(2)}/month (≥$200)`);
    }

    if (creditUtilOk) {
      if (credit30d.detected) {
        criteria.push(
          `Credit utilization under 30% (${credit30d.evidence.overallUtilization.percent.toFixed(0)}%)`
        );
      } else {
        criteria.push('No credit card debt');
      }
    }

    evidence.savingsAccounts = positiveAccounts.map((a) => ({
      type: a.type,
      growthRate: a.growthRate,
      netInflow: a.netInflow,
      endBalance: a.endBalance,
    }));
    evidence.totalSavings = savings180d.evidence.totalSavings;
    evidence.emergencyFundCoverage = savings180d.evidence.emergencyFundCoverage;
    if (credit30d.detected) {
      evidence.creditUtilization = credit30d.evidence.overallUtilization.percent;
    }
  }

  return {
    persona: 'savings_builder',
    checked: true,
    matched,
    criteria,
    evidence,
  };
}

/**
 * 6. Low-Use
 *
 * Formula: outboundPaymentCount180d < 10 AND
 *          outboundPaymentCount30d < 5 AND
 *          uniquePaymentMerchants < 5
 */
export function checkLowUse(signals: DetectedSignals): DecisionNode {
  const criteria: string[] = [];
  const evidence: Record<string, any> = {};

  const activity180d = signals.bankingActivity['180d'];
  let matched = false;

  if (!activity180d.detected) {
    return {
      persona: 'low_use',
      checked: true,
      matched: false,
      criteria: ['No banking activity signal'],
      evidence: {},
    };
  }

  const { outboundPaymentCount180d, outboundPaymentCount30d, uniquePaymentMerchants } =
    activity180d.evidence;

  if (
    outboundPaymentCount180d < 10 &&
    outboundPaymentCount30d < 5 &&
    uniquePaymentMerchants < 5
  ) {
    matched = true;
    criteria.push(`Only ${outboundPaymentCount180d} payments in 180 days (<10)`);
    criteria.push(`Only ${outboundPaymentCount30d} payments in 30 days (<5)`);
    criteria.push(`Only ${uniquePaymentMerchants} unique merchants (<5)`);

    evidence.outboundPaymentCount180d = outboundPaymentCount180d;
    evidence.outboundPaymentCount30d = outboundPaymentCount30d;
    evidence.uniquePaymentMerchants = uniquePaymentMerchants;
  }

  return {
    persona: 'low_use',
    checked: true,
    matched,
    criteria,
    evidence,
  };
}
