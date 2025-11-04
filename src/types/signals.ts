/**
 * Signal Detection Type Definitions
 *
 * Based on specifications in docs/signal-detection.md
 */

export type TimeWindow = '30d' | '180d';

export interface SubscriptionSignal {
  detected: boolean;
  evidence: {
    subscriptions: Array<{
      merchant: string;
      amount: number;
      cadence: 'weekly' | 'biweekly' | 'monthly';
      lastChargeDate: string;
      count: number;
    }>;
    totalMonthlySpend: number;
    subscriptionShareOfSpend: number;
  };
  window: TimeWindow;
}

export interface SavingsSignal {
  detected: boolean;
  evidence: {
    accounts: Array<{
      accountId: string;
      type: string;
      startBalance: number;
      endBalance: number;
      growthRate: number;
      netInflow: number;
    }>;
    totalSavings: number;
    emergencyFundCoverage: number;
  };
  window: TimeWindow;
}

export interface CreditSignal {
  detected: boolean;
  evidence: {
    accounts: Array<{
      accountId: string;
      mask: string;
      utilization: number;
      balance: number;
      limit: number;
      minimumPaymentOnly: boolean;
      hasInterestCharges: boolean;
      isOverdue: boolean;
    }>;
    maxUtilization: number;
    avgUtilization: number;
  };
  window: TimeWindow;
}

export interface IncomeSignal {
  detected: boolean;
  evidence: {
    payrollTransactions: Array<{
      date: string;
      amount: number;
    }>;
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'irregular';
    medianPayGap: number;
    averageIncome: number;
    cashFlowBuffer: number;
  };
  window: TimeWindow;
}

export interface OverdraftSignal {
  detected: boolean;
  evidence: {
    incidents: Array<{
      date: string;
      amount: number;
      type: 'negative_balance' | 'nsf_fee' | 'overdraft_fee';
    }>;
    count30d: number;
    count180d: number;
    totalFees: number;
  };
  window: TimeWindow;
}

export interface BankingActivitySignal {
  detected: boolean;
  evidence: {
    outboundPaymentCount30d: number;
    outboundPaymentCount180d: number;
    uniquePaymentMerchants: number;
  };
  window: TimeWindow;
}

export interface DetectedSignals {
  subscriptions: {
    '30d': SubscriptionSignal;
    '180d': SubscriptionSignal;
  };
  savings: {
    '30d': SavingsSignal;
    '180d': SavingsSignal;
  };
  credit: {
    '30d': CreditSignal;
    '180d': CreditSignal;
  };
  income: {
    '30d': IncomeSignal;
    '180d': IncomeSignal;
  };
  overdrafts: {
    '30d': OverdraftSignal;
    '180d': OverdraftSignal;
  };
  bankingActivity: {
    '30d': BankingActivitySignal;
    '180d': BankingActivitySignal;
  };
}
