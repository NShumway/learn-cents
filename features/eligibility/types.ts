export interface EligibilityRequirements {
  // Credit requirements
  maxCreditUtilization?: number; // User must be <= this
  minCreditUtilization?: number; // User must be >= this

  // Savings requirements
  minSavingsBalance?: number;
  minEmergencyFundCoverage?: number; // Months

  // Income requirements
  minMonthlyIncome?: number;
  incomeStability?: 'stable' | 'variable' | 'any';

  // Existing accounts (prevent duplicate products)
  requiresNoSavingsAccount?: boolean;
  requiresNoCreditCard?: boolean;
  requiresNoMoneyMarket?: boolean;
  requiresNoHSA?: boolean;

  // Custom rules (future expansion)
  customRules?: string[];
}

export interface EligibilityMetrics {
  // Credit metrics
  maxCreditUtilization: number;
  avgCreditUtilization: number;
  totalCreditBalance: number;
  totalCreditLimit: number;
  totalInterestPaid: number;

  // Savings metrics
  totalSavingsBalance: number;
  emergencyFundCoverage: number; // Months

  // Income metrics
  estimatedMonthlyIncome: number;
  incomeStability: 'stable' | 'variable' | 'unknown';

  // Existing accounts
  hasCheckingAccount: boolean;
  hasSavingsAccount: boolean;
  hasCreditCard: boolean;
  hasMoneyMarket: boolean;
  hasHSA: boolean;
}

export interface PartnerOffer {
  id: string;
  offerName: string;
  offerPitch: string;
  targetedPersonas: string[];
  priorityPerPersona: Record<string, number>;
  eligibilityReqs: EligibilityRequirements;
  activeDateStart: Date;
  activeDateEnd: Date | null;
}
