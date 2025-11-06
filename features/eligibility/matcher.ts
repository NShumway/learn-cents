import type { EligibilityMetrics, EligibilityRequirements, PartnerOffer } from './types';

export function matchOffersToUser(
  offers: PartnerOffer[],
  metrics: EligibilityMetrics,
  persona: string
): PartnerOffer[] {
  const now = new Date();

  // Filter offers by eligibility and active dates
  const eligibleOffers = offers.filter((offer) => {
    // Check if offer is active
    if (offer.activeDateStart > now) return false;
    if (offer.activeDateEnd && offer.activeDateEnd < now) return false;

    // Check if persona matches
    if (!offer.targetedPersonas.includes(persona)) return false;

    // Check eligibility requirements
    if (!meetsEligibilityRequirements(metrics, offer.eligibilityReqs)) {
      return false;
    }

    return true;
  });

  // Sort by priority for the user's persona
  const sortedOffers = eligibleOffers.sort((a, b) => {
    const priorityA = a.priorityPerPersona[persona] || 999;
    const priorityB = b.priorityPerPersona[persona] || 999;
    return priorityA - priorityB;
  });

  return sortedOffers;
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
