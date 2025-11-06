/**
 * Persona Type Definitions
 *
 * Based on specifications in docs/persona-assignment.md
 */

export type PersonaType =
  | 'overdraft_vulnerable'
  | 'high_utilization'
  | 'variable_income_budgeter'
  | 'subscription_heavy'
  | 'savings_builder'
  | 'low_use'
  | 'steady';

export interface PersonaAssignment {
  persona: PersonaType;
  reasoning: string[]; // Why this persona was assigned
  evidence: {
    // Key metrics that led to this assignment
    [key: string]: unknown;
  };
}

export const PERSONA_LABELS: Record<PersonaType, string> = {
  overdraft_vulnerable: 'Overdraft-Vulnerable',
  high_utilization: 'High Utilization',
  variable_income_budgeter: 'Variable-Income Budgeter',
  subscription_heavy: 'Subscription-Heavy',
  savings_builder: 'Savings Builder',
  low_use: 'Low-Use',
  steady: 'Steady',
};

export const PERSONA_DESCRIPTIONS: Record<PersonaType, string> = {
  overdraft_vulnerable:
    'Experiencing recent overdrafts or negative balances that need immediate attention',
  high_utilization: 'Credit card utilization is high or showing signs of debt stress',
  variable_income_budgeter: 'Income arrives irregularly with limited cash flow buffer',
  subscription_heavy: 'Multiple recurring subscriptions consuming significant monthly spending',
  savings_builder: 'Actively building savings with low credit utilization',
  low_use: 'Limited banking activity - opportunity to engage with more financial tools',
  steady: 'Maintaining steady financial patterns without major concerns',
};
