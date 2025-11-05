/**
 * UI Assessment Types
 *
 * These types represent the assessment data structure for UI display.
 * They extend Phase 2 types with rendered content and education items.
 */

import type { PersonaType } from '../../src/types/persona';
import type { DecisionTree } from '../../src/personas/assignPersonas';

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
  renderedForUser: string;  // Human-readable explanation
  educationItems: EducationItem[];
  evidence: Record<string, unknown>;  // Raw evidence from signal detection
}

/**
 * Complete assessment for display
 */
export interface Assessment {
  priorityInsight: Insight;
  additionalInsights: Insight[];
  decisionTree: DecisionTree;
}
