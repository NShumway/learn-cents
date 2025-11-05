/**
 * Assessment Type Definitions
 *
 * Assessment = Signals + Personas + Rendered Insights + Education
 */

import type { PersonaType } from './persona';
import type { DetectedSignals } from './signals';
import type { DecisionTree } from '../personas/assignPersonas';

/**
 * Education item for a persona insight
 */
export interface EducationItem {
  title: string;
  description: string;
}

/**
 * Single insight for a persona with rendered content
 */
export interface Insight {
  personaType: PersonaType;
  personaLabel: string;
  priority: number;
  renderedForUser: string; // Human-readable explanation
  educationItems: EducationItem[];
  evidence: Record<string, unknown>; // Raw evidence from signals
}

/**
 * Complete assessment for a user
 */
export interface Assessment {
  priorityInsight: Insight;
  additionalInsights: Insight[];
  decisionTree: DecisionTree;
  signals: DetectedSignals; // Keep signals for potential later use
}
