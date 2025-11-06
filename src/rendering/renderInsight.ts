/**
 * Insight Rendering Functions
 *
 * Convert evidence from signal detection into user-friendly text.
 * All content is educational only, not financial advice.
 */

import type { PersonaType } from '../types/persona';
import type { DetectedSignals } from '../types/signals';

/**
 * Render user-friendly insight text for overdraft_vulnerable persona
 */
export function renderOverdraftVulnerable(signals: DetectedSignals): string {
  const overdraft30d = signals.overdrafts['30d'];
  const overdraft180d = signals.overdrafts['180d'];

  const count30d = overdraft30d.evidence.count30d;
  const count180d = overdraft180d.evidence.count180d;
  const totalFees = overdraft180d.evidence.totalFees;

  const recentText = count30d > 0 ? `${count30d} in the past month` : '';
  const overallText = count180d > 0 ? `${count180d} in the past 6 months` : '';

  let text = `You have had ${recentText}${recentText && overallText ? ' and ' : ''}${overallText} overdraft incident${count180d === 1 ? '' : 's'}`;

  if (totalFees > 0) {
    text += `, costing you $${totalFees.toFixed(2)} in fees`;
  }

  text +=
    '. Overdrafts can be stressful and expensive. Let us work on building a small buffer to prevent these in the future.';

  return text;
}

/**
 * Render user-friendly insight text for high_utilization persona
 */
export function renderHighUtilization(signals: DetectedSignals): string {
  const credit = signals.credit['30d'];
  const { overallUtilization, accounts } = credit.evidence;

  const utilizationPercent = overallUtilization.percent;
  const accountsWithInterest = accounts.filter((a) => a.hasInterestCharges).length;
  const isHighUtil = utilizationPercent >= 50;

  let text = '';

  // Lead with the primary concern
  if (isHighUtil && accountsWithInterest > 0) {
    // Both high utilization AND interest charges
    text = `Your credit card usage is running high. You are carrying balances that put you at ${utilizationPercent.toFixed(1)}% utilization across your cards, and you are paying interest charges on ${accountsWithInterest} account${accountsWithInterest === 1 ? '' : 's'}.`;
    text += ' This high utilization can significantly impact your credit score.';
  } else if (isHighUtil) {
    // High utilization only
    text = `Your credit card usage is running high. You are carrying balances that put you at ${utilizationPercent.toFixed(1)}% utilization across your cards.`;
    text += ' This high utilization can significantly impact your credit score.';
  } else if (accountsWithInterest > 0) {
    // Interest charges but not high utilization
    text = `You are paying interest charges on ${accountsWithInterest} credit card account${accountsWithInterest === 1 ? '' : 's'}. While your overall utilization is ${utilizationPercent.toFixed(1)}% (which is good), carrying balances that accrue interest can be costly over time.`;
  } else {
    // Edge case: matched high_utilization but not high util or interest (e.g., minimum payment only)
    text = `You have credit card activity that needs attention. Your overall utilization is ${utilizationPercent.toFixed(1)}%.`;
  }

  text += ' Let us work on bringing these balances down.';

  return text;
}

/**
 * Render user-friendly insight text for variable_income_budgeter persona
 */
export function renderVariableIncomeBudgeter(signals: DetectedSignals): string {
  const income = signals.income['180d'];
  const { frequency, cashFlowBuffer, medianPayGap } = income.evidence;

  let text = '';

  if (frequency === 'irregular') {
    text = `Your income arrives irregularly, with about ${medianPayGap} day${medianPayGap === 1 ? '' : 's'} between payments on average.`;
  } else {
    text = `Your income frequency is ${frequency}, which can make budgeting challenging.`;
  }

  const bufferPercent = (cashFlowBuffer * 100).toFixed(1);
  text += ` You are currently maintaining a ${bufferPercent}% cash flow buffer.`;

  if (cashFlowBuffer < 0.1) {
    text += ' Building a larger buffer could help smooth out the gaps between paychecks.';
  }

  return text;
}

/**
 * Render user-friendly insight text for subscription_heavy persona
 */
export function renderSubscriptionHeavy(signals: DetectedSignals): string {
  const subscriptions = signals.subscriptions['30d'];
  const { subscriptions: subs, subscriptionShareOfSpend } = subscriptions.evidence;

  const count = subs.length;
  const totalMonthly = subs.reduce((sum, sub) => sum + sub.amount, 0);
  const sharePercent = subscriptionShareOfSpend.toFixed(0);

  let text = `You have ${count} recurring subscription${count === 1 ? '' : 's'} totaling $${totalMonthly.toFixed(2)} per month.`;

  text += ` That is about ${sharePercent}% of your spending.`;

  if (count >= 5) {
    text +=
      ' Consider auditing which ones you actively use. Canceling just 1-2 unused services could free up money.';
  } else {
    text += ' It may be worth reviewing whether you are getting value from all of them.';
  }

  return text;
}

/**
 * Render user-friendly insight text for savings_builder persona
 */
export function renderSavingsBuilder(signals: DetectedSignals): string {
  const savings = signals.savings['180d'];
  const { totalSavings, emergencyFundCoverage, accounts } = savings.evidence;

  let text = `You are building savings! You currently have $${totalSavings.toFixed(2)} in savings accounts.`;

  if (emergencyFundCoverage > 0) {
    const monthsText = emergencyFundCoverage.toFixed(1);
    text += ` That covers about ${monthsText} month${emergencyFundCoverage === 1 ? '' : 's'} of expenses.`;

    if (emergencyFundCoverage < 3) {
      text += ' Financial experts recommend 3-6 months for a full emergency fund.';
    } else if (emergencyFundCoverage >= 6) {
      text += ' Great job! You have hit the recommended 6-month emergency fund goal.';
    } else {
      text += ' You are on track toward the recommended 3-6 month emergency fund.';
    }
  }

  const growingAccounts = accounts.filter((a) => a.growthRate > 0).length;
  if (growingAccounts > 0) {
    text += ` ${growingAccounts} of your account${growingAccounts === 1 ? ' is' : 's are'} actively growing.`;
  }

  return text;
}

/**
 * Render user-friendly insight text for low_use persona
 */
export function renderLowUse(signals: DetectedSignals): string {
  const banking = signals.bankingActivity['180d'];
  const { outboundPaymentCount180d, uniquePaymentMerchants } = banking.evidence;

  let text = `Your banking activity has been light, with ${outboundPaymentCount180d} transaction${outboundPaymentCount180d === 1 ? '' : 's'} across ${uniquePaymentMerchants} merchant${uniquePaymentMerchants === 1 ? '' : 's'} in the past 6 months.`;

  text +=
    ' If you are just getting started with digital banking, that is great! Explore features like mobile check deposit and bill pay to make managing money easier.';

  return text;
}

/**
 * Render user-friendly insight text for steady persona
 */
export function renderSteady(signals: DetectedSignals): string {
  const signalsDetected = [];

  if (signals.income['180d'].detected) signalsDetected.push('regular income');
  if (signals.savings['180d'].detected) signalsDetected.push('savings activity');
  if (signals.credit['30d'].detected) signalsDetected.push('credit usage');
  if (signals.subscriptions['30d'].detected) signalsDetected.push('subscriptions');

  let text = `Your finances look steady. No major concerns detected.`;

  if (signalsDetected.length > 0) {
    text += ` You have ${signalsDetected.join(', ')}.`;
  }

  text +=
    ' Keep up the good work! Consider exploring ways to optimize your finances, like high-yield savings accounts or reviewing investment options.';

  return text;
}

/**
 * Main rendering dispatcher - routes to the correct render function
 */
export function renderInsightForPersona(
  personaType: PersonaType,
  signals: DetectedSignals
): string {
  switch (personaType) {
    case 'overdraft_vulnerable':
      return renderOverdraftVulnerable(signals);
    case 'high_utilization':
      return renderHighUtilization(signals);
    case 'variable_income_budgeter':
      return renderVariableIncomeBudgeter(signals);
    case 'subscription_heavy':
      return renderSubscriptionHeavy(signals);
    case 'savings_builder':
      return renderSavingsBuilder(signals);
    case 'low_use':
      return renderLowUse(signals);
    case 'steady':
      return renderSteady(signals);
    default:
      return 'Unable to generate insight for this persona type.';
  }
}
