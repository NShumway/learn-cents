/**
 * Mock Assessment Data for UI Development
 *
 * Real assessment generated from Phase 2 buildAssessment()
 * Based on synthetic user data for UI development and testing
 */

import type { Assessment } from '../types/assessment';

export const mockAssessment: Assessment = {
  priorityInsight: {
    personaType: 'high_utilization',
    personaLabel: 'High Utilization',
    priority: 2,
    renderedForUser:
      'Your credit card usage is running high. You are carrying balances that put you at 24.7% utilization across your cards. You are paying interest charges on 1 account. Let us work on bringing these balances down.',
    educationItems: [
      {
        title: 'Understanding Credit Utilization',
        description:
          'Learn how credit card utilization affects your credit score and financial health. Keeping utilization under 30% is ideal.',
      },
      {
        title: 'Debt Paydown Strategies',
        description:
          'Explore the avalanche method (highest interest first) and snowball method (smallest balance first) to efficiently pay down credit card debt.',
      },
      {
        title: 'Setting Up Autopay',
        description:
          'Set up automatic payments to avoid missed payments and late fees, while working toward paying more than the minimum.',
      },
      {
        title: 'Balance Transfer Considerations',
        description:
          'Learn about balance transfer cards and when they might help reduce interest charges on existing debt.',
      },
    ],
    evidence: {
      hasInterestCharges: true,
      accountsAffected: 1,
      totalBalance: 1265.05,
      overallUtilization: 24.71,
    },
  },
  additionalInsights: [],
  decisionTree: {
    signalsDetected: ['credit', 'income', 'subscriptions'],
    personasEvaluated: [
      {
        persona: 'overdraft_vulnerable',
        checked: true,
        matched: false,
        criteria: [],
        evidence: {},
      },
      {
        persona: 'high_utilization',
        checked: true,
        matched: true,
        criteria: ['1 card(s) carrying interest charges'],
        evidence: {
          hasInterestCharges: true,
          accountsAffected: 1,
          totalBalance: 1265.05,
          overallUtilization: 24.71,
        },
      },
      {
        persona: 'variable_income_budgeter',
        checked: true,
        matched: false,
        criteria: [],
        evidence: {},
      },
      {
        persona: 'subscription_heavy',
        checked: true,
        matched: false,
        criteria: [],
        evidence: {},
      },
      {
        persona: 'savings_builder',
        checked: true,
        matched: false,
        criteria: ['No savings activity detected'],
        evidence: {},
      },
      {
        persona: 'low_use',
        checked: true,
        matched: false,
        criteria: ['No banking activity signal'],
        evidence: {},
      },
    ],
    primaryPersona: 'high_utilization',
    reasoning: 'Assigned high_utilization (priority 2) based on: 1 card(s) carrying interest charges',
  },
  signals: {} as any, // Not needed for UI display
};
