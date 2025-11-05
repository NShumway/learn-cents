/**
 * Assessment Builder
 *
 * Combines signals + personas + rendering + education into complete assessment
 */

import type { DetectedSignals } from '../types/signals';
import type { PersonaAssignmentResult } from '../personas/assignPersonas';
import type { Assessment, Insight } from '../types/assessment';
import { PERSONA_LABELS } from '../types/persona';
import { renderInsightForPersona } from '../rendering/renderInsight';
import { EDUCATION_CATALOG } from '../education/educationCatalog';

/**
 * Persona priority order (matches persona assignment logic)
 */
const PERSONA_PRIORITY: Record<string, number> = {
  overdraft_vulnerable: 1,
  high_utilization: 2,
  variable_income_budgeter: 3,
  subscription_heavy: 4,
  savings_builder: 5,
  low_use: 6,
  steady: 7,
};

/**
 * Build complete assessment from signals and persona assignment
 *
 * @param personaResult - Result from persona assignment
 * @param signals - Detected signals from signal detection
 * @returns Complete assessment with rendered insights and education
 */
export function buildAssessment(
  personaResult: PersonaAssignmentResult,
  signals: DetectedSignals
): Assessment {
  // Build insights for all matched personas
  const insights: Insight[] = personaResult.personas.map((assignment) => {
    const personaType = assignment.persona;

    return {
      personaType,
      personaLabel: PERSONA_LABELS[personaType],
      priority: PERSONA_PRIORITY[personaType] || 99,
      renderedForUser: renderInsightForPersona(personaType, signals),
      educationItems: EDUCATION_CATALOG[personaType] || [],
      evidence: assignment.evidence,
    };
  });

  // First insight is priority, rest are additional
  const [priorityInsight, ...additionalInsights] = insights;

  return {
    priorityInsight,
    additionalInsights,
    decisionTree: personaResult.decisionTree,
    signals, // Keep signals for potential later use (partner offers, etc.)
  };
}
