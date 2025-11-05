/**
 * Mock Assessment Data for UI Development
 *
 * This represents what a fully-rendered assessment looks like
 * (Phase 2 personas + rendered text + education items)
 */

import type { Assessment } from '../types/assessment';

export const mockAssessment: Assessment = {
  priorityInsight: {
    personaType: 'high_utilization',
    personaLabel: 'High Utilization',
    priority: 2,
    renderedForUser:
      "Your credit card usage is running high. You're carrying balances that put you at 68% utilization across your cards. This can impact your credit score and you're paying $92.70 in interest charges each month. Let's work on bringing these balances down.",
    educationItems: [
      {
        title: 'Understanding Credit Utilization',
        description:
          'Learn how credit card utilization affects your credit score and financial health. Keeping utilization under 30% is ideal for your credit score.',
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
    ],
    evidence: {
      accounts: [
        {
          accountId: 'acc_1',
          mask: '4532',
          utilizationBucket: '50_to_80',
          utilizationPercent: 68,
          balance: 3400,
          limit: 5000,
          minimumPaymentOnly: true,
          hasInterestCharges: true,
          isOverdue: false,
        },
        {
          accountId: 'acc_2',
          mask: '1234',
          utilizationBucket: '30_to_50',
          utilizationPercent: 42,
          balance: 2100,
          limit: 5000,
          minimumPaymentOnly: false,
          hasInterestCharges: true,
          isOverdue: false,
        },
      ],
      overallUtilization: {
        percent: 55,
        bucket: '50_to_80',
      },
    },
  },
  additionalInsights: [
    {
      personaType: 'subscription_heavy',
      personaLabel: 'Subscription-Heavy',
      priority: 4,
      renderedForUser:
        "You have 6 recurring subscriptions totaling $155.93 per month. That's about 12% of your spending. Consider auditing which ones you actively use—canceling just 1-2 unused services could free up money for debt paydown.",
      educationItems: [
        {
          title: 'Audit Active Subscriptions',
          description:
            'Review all your recurring charges and cancel unused services. Many people forget about subscriptions they signed up for months ago.',
        },
        {
          title: 'Subscription Alternatives',
          description:
            'Explore free or lower-cost alternatives to your current subscriptions. Some services offer annual plans at significant discounts.',
        },
      ],
      evidence: {
        subscriptions: [
          {
            merchant: 'Netflix',
            amount: 15.99,
            cadence: 'monthly',
            lastChargeDate: '2024-03-15',
            count: 6,
          },
          {
            merchant: 'Spotify',
            amount: 9.99,
            cadence: 'monthly',
            lastChargeDate: '2024-03-10',
            count: 6,
          },
          {
            merchant: 'Adobe Creative Cloud',
            amount: 54.99,
            cadence: 'monthly',
            lastChargeDate: '2024-03-12',
            count: 6,
          },
        ],
        totalMonthlySpend: 2400,
        subscriptionShareOfSpend: 12,
      },
    },
  ],
  decisionTree: {
    signalsDetected: ['credit', 'subscriptions', 'income'],
    personasEvaluated: [
      {
        persona: 'overdraft_vulnerable',
        checked: true,
        matched: false,
        criteria: ['No overdrafts detected in past 30 days'],
        evidence: {},
      },
      {
        persona: 'high_utilization',
        checked: true,
        matched: true,
        criteria: [
          'Overall utilization ≥50%',
          'Interest charges detected',
          'Multiple accounts with high balances',
        ],
        evidence: {
          overallUtilization: 55,
          accountsWithInterest: 2,
        },
      },
      {
        persona: 'variable_income_budgeter',
        checked: true,
        matched: false,
        criteria: ['Income frequency is regular (biweekly)'],
        evidence: {},
      },
      {
        persona: 'subscription_heavy',
        checked: true,
        matched: true,
        criteria: ['≥3 recurring merchants', 'Subscription share ≥10%'],
        evidence: {
          subscriptionCount: 6,
          subscriptionShareOfSpend: 12,
        },
      },
      {
        persona: 'savings_builder',
        checked: true,
        matched: false,
        criteria: ['No savings growth detected'],
        evidence: {},
      },
      {
        persona: 'low_use',
        checked: true,
        matched: false,
        criteria: ['Sufficient banking activity detected'],
        evidence: {},
      },
    ],
    primaryPersona: 'high_utilization',
    reasoning:
      'Assigned high_utilization (priority 2) based on: Overall utilization ≥50%, Interest charges detected, Multiple accounts with high balances',
  },
};
