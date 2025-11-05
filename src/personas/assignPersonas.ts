/**
 * Persona Assignment Orchestrator
 *
 * Assigns financial personas based on detected signals following the priority order
 * defined in docs/persona-assignment.md
 *
 * Priority Order (highest to lowest):
 * 1. Overdraft-Vulnerable
 * 2. High Utilization
 * 3. Variable-Income Budgeter
 * 4. Subscription-Heavy
 * 5. Savings Builder
 * 6. Low-Use
 * 7. Steady (default)
 */

import { DetectedSignals } from '../types/signals';
import { PersonaAssignment, PersonaType } from '../types/persona';
import {
  checkOverdraftVulnerable,
  checkHighUtilization,
  checkVariableIncomeBudgeter,
  checkSubscriptionHeavy,
  checkSavingsBuilder,
  checkLowUse,
} from './criteria';

/**
 * Decision tree node representing an assignment decision
 */
export interface DecisionNode {
  persona: PersonaType;
  checked: boolean;
  matched: boolean;
  criteria: string[];
  evidence: Record<string, unknown>;
}

/**
 * Complete decision tree showing all persona evaluations
 */
export interface DecisionTree {
  signalsDetected: string[];
  personasEvaluated: DecisionNode[];
  primaryPersona: PersonaType;
  reasoning: string;
}

/**
 * Result of persona assignment including ordered personas and decision tree
 */
export interface PersonaAssignmentResult {
  personas: PersonaAssignment[]; // Ordered by priority, [0] is primary
  decisionTree: DecisionTree;
}

/**
 * Assign personas to user based on detected signals
 *
 * Evaluates all personas in priority order. Returns ALL matching personas
 * in an ordered array, with the highest priority match at index [0].
 * Also returns the decision tree showing how decisions were made.
 */
export function assignPersona(signals: DetectedSignals): PersonaAssignmentResult {
  const decisionNodes: DecisionNode[] = [];
  const signalsDetected: string[] = [];
  const matchedPersonas: PersonaAssignment[] = [];

  // Track which signals were detected
  if (signals.overdrafts['30d'].detected || signals.overdrafts['180d'].detected) {
    signalsDetected.push('overdrafts');
  }
  if (signals.credit['30d'].detected || signals.credit['180d'].detected) {
    signalsDetected.push('credit');
  }
  if (signals.income['180d'].detected) {
    signalsDetected.push('income');
  }
  if (signals.subscriptions['30d'].detected || signals.subscriptions['180d'].detected) {
    signalsDetected.push('subscriptions');
  }
  if (signals.savings['180d'].detected) {
    signalsDetected.push('savings');
  }
  if (signals.bankingActivity['180d'].detected) {
    signalsDetected.push('bankingActivity');
  }

  // Check each persona in priority order and collect ALL matches

  // 1. Overdraft-Vulnerable
  const overdraft = checkOverdraftVulnerable(signals);
  decisionNodes.push(overdraft);
  if (overdraft.matched) {
    matchedPersonas.push({
      persona: overdraft.persona,
      reasoning: overdraft.criteria,
      evidence: overdraft.evidence,
    });
  }

  // 2. High Utilization
  const highUtil = checkHighUtilization(signals);
  decisionNodes.push(highUtil);
  if (highUtil.matched) {
    matchedPersonas.push({
      persona: highUtil.persona,
      reasoning: highUtil.criteria,
      evidence: highUtil.evidence,
    });
  }

  // 3. Variable-Income Budgeter
  const variableIncome = checkVariableIncomeBudgeter(signals);
  decisionNodes.push(variableIncome);
  if (variableIncome.matched) {
    matchedPersonas.push({
      persona: variableIncome.persona,
      reasoning: variableIncome.criteria,
      evidence: variableIncome.evidence,
    });
  }

  // 4. Subscription-Heavy
  const subscriptionHeavy = checkSubscriptionHeavy(signals);
  decisionNodes.push(subscriptionHeavy);
  if (subscriptionHeavy.matched) {
    matchedPersonas.push({
      persona: subscriptionHeavy.persona,
      reasoning: subscriptionHeavy.criteria,
      evidence: subscriptionHeavy.evidence,
    });
  }

  // 5. Savings Builder
  const savingsBuilder = checkSavingsBuilder(signals);
  decisionNodes.push(savingsBuilder);
  if (savingsBuilder.matched) {
    matchedPersonas.push({
      persona: savingsBuilder.persona,
      reasoning: savingsBuilder.criteria,
      evidence: savingsBuilder.evidence,
    });
  }

  // 6. Low-Use
  const lowUse = checkLowUse(signals);
  decisionNodes.push(lowUse);
  if (lowUse.matched) {
    matchedPersonas.push({
      persona: lowUse.persona,
      reasoning: lowUse.criteria,
      evidence: lowUse.evidence,
    });
  }

  // 7. Steady (default - only if no other matches)
  if (matchedPersonas.length === 0) {
    matchedPersonas.push({
      persona: 'steady',
      reasoning: ['No specific financial patterns detected - maintaining steady state'],
      evidence: {},
    });
    decisionNodes.push({
      persona: 'steady',
      checked: true,
      matched: true,
      criteria: ['Default assignment - no other personas matched'],
      evidence: {},
    });
  }

  // Build decision tree
  const primaryPersona = matchedPersonas[0].persona;
  const decisionTree: DecisionTree = {
    signalsDetected,
    personasEvaluated: decisionNodes,
    primaryPersona,
    reasoning: buildReasoningString(matchedPersonas[0], decisionNodes),
  };

  return {
    personas: matchedPersonas,
    decisionTree,
  };
}

/**
 * Build human-readable reasoning string for primary persona
 */
function buildReasoningString(
  primaryAssignment: PersonaAssignment,
  nodes: DecisionNode[]
): string {
  const matchedNode = nodes.find((n) => n.persona === primaryAssignment.persona);
  if (!matchedNode) {
    return 'Default assignment - no specific patterns detected';
  }

  const priorityIndex = nodes.indexOf(matchedNode) + 1;
  const criteriaList = matchedNode.criteria.join(', ');
  return `Assigned ${primaryAssignment.persona} (priority ${priorityIndex}) based on: ${criteriaList}`;
}
