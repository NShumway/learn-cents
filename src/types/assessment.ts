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
 * Partner offer recommendation
 */
export interface PartnerOffer {
  id: string;
  offerName: string;
  offerPitch: string;
  targetedPersonas: string[];
  priorityPerPersona: Record<string, number>;
  activeDateStart: Date;
  activeDateEnd: Date | null;
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
  partnerOffer?: PartnerOffer | null; // Optional matched partner offer
}

/**
 * Complete assessment for a user
 */
export interface Assessment {
  id?: string; // Database ID when loaded from server
  priorityInsight: Insight;
  additionalInsights: Insight[];
  decisionTree: DecisionTree;
  signals: DetectedSignals; // Keep signals for potential later use
}
