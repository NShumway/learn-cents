/**
 * Education Items Catalog
 *
 * Central repository of educational content for each persona.
 * Content is educational only, not financial advice.
 */

import type { PersonaType } from '../types/persona';
import type { EducationItem } from '../types/assessment';

export const EDUCATION_CATALOG: Record<PersonaType, EducationItem[]> = {
  overdraft_vulnerable: [
    {
      title: 'Understanding Overdraft Fees',
      description:
        'Learn how overdraft and NSF fees work, why they happen, and strategies to avoid them in the future.',
    },
    {
      title: 'Building a Cash Flow Buffer',
      description:
        'Discover techniques for maintaining a small buffer in your checking account to prevent overdrafts during unexpected expenses.',
    },
    {
      title: 'Setting Up Low Balance Alerts',
      description:
        'Learn how to set up text or email alerts when your balance drops below a threshold, giving you time to transfer funds.',
    },
    {
      title: 'Overdraft Protection Options',
      description:
        'Understand the different overdraft protection options available and which might be right for your situation.',
    },
  ],

  high_utilization: [
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

  variable_income_budgeter: [
    {
      title: 'Zero-Based Budgeting',
      description:
        'Learn how to allocate every dollar of income to specific purposes, ensuring bills are covered even with irregular pay.',
    },
    {
      title: 'Building an Income Buffer',
      description:
        'Strategies for building and maintaining a buffer to smooth out irregular income periods.',
    },
    {
      title: 'Prioritizing Expenses',
      description:
        'Learn how to rank your expenses by importance and create a plan for weeks when income is lower than expected.',
    },
    {
      title: 'Tracking Variable Income',
      description:
        'Tools and techniques for tracking income patterns to better predict cash flow and plan ahead.',
    },
  ],

  subscription_heavy: [
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
    {
      title: 'Subscription Tracking Tools',
      description:
        'Learn about apps and tools that help you track all your recurring charges in one place.',
    },
    {
      title: 'Mindful Subscription Habits',
      description:
        'Develop habits for evaluating new subscription offers and setting reminders to review existing ones quarterly.',
    },
  ],

  savings_builder: [
    {
      title: 'Emergency Fund Basics',
      description:
        'Learn why financial experts recommend 3-6 months of expenses in emergency savings and how to build toward that goal.',
    },
    {
      title: 'Automating Savings',
      description:
        'Set up automatic transfers to your savings account to make saving effortless and consistent.',
    },
    {
      title: 'High-Yield Savings Accounts',
      description:
        'Discover how high-yield savings accounts can help your emergency fund grow faster with competitive interest rates.',
    },
    {
      title: 'Savings Milestones',
      description:
        'Break down your savings goal into achievable milestones to stay motivated on your journey.',
    },
  ],

  low_use: [
    {
      title: 'Banking Basics',
      description:
        'Get familiar with common banking features like direct deposit, mobile check deposit, and bill pay.',
    },
    {
      title: 'Building Financial Habits',
      description:
        'Learn how to establish regular financial habits like checking your balance weekly and reviewing statements monthly.',
    },
    {
      title: 'Understanding Account Types',
      description:
        'Explore the differences between checking, savings, and other account types to make informed choices.',
    },
    {
      title: 'Digital Banking Tools',
      description:
        'Discover mobile apps and online tools that make managing your money easier and more convenient.',
    },
  ],

  steady: [
    {
      title: 'Maintaining Financial Health',
      description:
        'Learn best practices for staying on track with your current financial habits and avoiding common pitfalls.',
    },
    {
      title: 'Financial Planning Basics',
      description:
        'Explore next steps in your financial journey, from retirement planning to investing fundamentals.',
    },
    {
      title: 'Optimizing Your Finances',
      description:
        'Discover opportunities to improve returns on savings, reduce fees, and make your money work harder for you.',
    },
  ],
};
