import type { EligibilityMetrics, EligibilityRequirements, PartnerOffer } from './types';

export function matchOffersToUser(
  offers: PartnerOffer[],
  metrics: EligibilityMetrics,
  persona: string
): PartnerOffer | null {
  const now = new Date();

  console.log('[MATCHER] Starting match:', {
    offerCount: offers.length,
    persona,
    now: now.toISOString(),
  });

  // Filter offers by eligibility and active dates
  const eligibleOffers = offers.filter((offer) => {
    console.log(`[MATCHER] Checking offer: ${offer.offerName}`, {
      activeDateStart: offer.activeDateStart,
      activeDateEnd: offer.activeDateEnd,
      targetedPersonas: offer.targetedPersonas,
      eligibilityReqs: offer.eligibilityReqs,
    });

    // Check if offer is active
    if (offer.activeDateStart > now) {
      console.log(`[MATCHER] ❌ ${offer.offerName}: not yet active`);
      return false;
    }
    if (offer.activeDateEnd && offer.activeDateEnd < now) {
      console.log(`[MATCHER] ❌ ${offer.offerName}: expired`);
      return false;
    }

    // Check if persona matches (case-insensitive, handles spaces vs underscores)
    const normalizedPersona = persona.toLowerCase().replace(/\s+/g, '_');
    const personaMatches = offer.targetedPersonas.some(
      (p) => p.toLowerCase().replace(/\s+/g, '_') === normalizedPersona
    );
    if (!personaMatches) {
      console.log(`[MATCHER] ❌ ${offer.offerName}: persona mismatch (looking for ${persona})`);
      return false;
    }

    // Check eligibility requirements
    if (!meetsEligibilityRequirements(metrics, offer.eligibilityReqs)) {
      console.log(`[MATCHER] ❌ ${offer.offerName}: failed eligibility`);
      return false;
    }

    console.log(`[MATCHER] ✅ ${offer.offerName}: ELIGIBLE`);
    return true;
  });

  console.log('[MATCHER] Eligible offers:', eligibleOffers.length);

  // Sort by priority for the user's persona, with tie-breaking
  const normalizedPersona = persona.toLowerCase().replace(/\s+/g, '_');
  const sortedOffers = eligibleOffers.sort((a, b) => {
    // Try to find priority with normalized matching
    const priorityA =
      a.priorityPerPersona[persona] ||
      a.priorityPerPersona[normalizedPersona] ||
      Object.entries(a.priorityPerPersona).find(
        ([key]) => key.toLowerCase().replace(/\s+/g, '_') === normalizedPersona
      )?.[1] ||
      999;
    const priorityB =
      b.priorityPerPersona[persona] ||
      b.priorityPerPersona[normalizedPersona] ||
      Object.entries(b.priorityPerPersona).find(
        ([key]) => key.toLowerCase().replace(/\s+/g, '_') === normalizedPersona
      )?.[1] ||
      999;

    // Primary sort: by priority (lower number = higher priority)
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Tie-breaker: pick the one that ends later
    // null activeDateEnd = no expiration = highest priority
    if (a.activeDateEnd === null && b.activeDateEnd === null) return 0;
    if (a.activeDateEnd === null) return -1;
    if (b.activeDateEnd === null) return 1;
    return b.activeDateEnd.getTime() - a.activeDateEnd.getTime();
  });

  // Return the top offer, or null if no eligible offers
  return sortedOffers[0] || null;
}

function meetsEligibilityRequirements(
  metrics: EligibilityMetrics,
  requirements: EligibilityRequirements
): boolean {
  // Credit requirements
  if (
    requirements.maxCreditUtilization !== undefined &&
    metrics.maxCreditUtilization > requirements.maxCreditUtilization
  ) {
    return false;
  }

  if (
    requirements.minCreditUtilization !== undefined &&
    metrics.maxCreditUtilization < requirements.minCreditUtilization
  ) {
    return false;
  }

  // Savings requirements
  if (
    requirements.minSavingsBalance !== undefined &&
    metrics.totalSavingsBalance < requirements.minSavingsBalance
  ) {
    return false;
  }

  if (
    requirements.minEmergencyFundCoverage !== undefined &&
    metrics.emergencyFundCoverage < requirements.minEmergencyFundCoverage
  ) {
    return false;
  }

  // Income requirements
  if (
    requirements.minMonthlyIncome !== undefined &&
    metrics.estimatedMonthlyIncome < requirements.minMonthlyIncome
  ) {
    return false;
  }

  if (
    requirements.incomeStability &&
    requirements.incomeStability !== 'any' &&
    metrics.incomeStability !== requirements.incomeStability
  ) {
    return false;
  }

  // Existing accounts (prevent duplicate products)
  if (requirements.requiresNoSavingsAccount && metrics.hasSavingsAccount) {
    return false;
  }

  if (requirements.requiresNoCreditCard && metrics.hasCreditCard) {
    return false;
  }

  if (requirements.requiresNoMoneyMarket && metrics.hasMoneyMarket) {
    return false;
  }

  if (requirements.requiresNoHSA && metrics.hasHSA) {
    return false;
  }

  return true;
}

export function isPredatoryOffer(offer: PartnerOffer): boolean {
  const predatoryKeywords = [
    'payday',
    'cash advance',
    'title loan',
    'rent-to-own',
    'subprime',
    'guaranteed approval',
    'no credit check loan',
  ];

  const lowerName = offer.offerName.toLowerCase();
  const lowerPitch = offer.offerPitch.toLowerCase();

  return predatoryKeywords.some(
    (keyword) => lowerName.includes(keyword) || lowerPitch.includes(keyword)
  );
}
