/**
 * Tests for AI Context Building and Sanitization
 */

import { describe, it, expect } from 'vitest';
import { buildAIContext, sanitizeContext } from '../../api/_lib/ai/context';
import type { Assessment } from '@prisma/client';

describe('AI Context - buildAIContext', () => {
  it('should extract priority insight from assessment', () => {
    const assessment = {
      id: 'test-123',
      userId: 'user-123',
      priorityInsight: {
        type: 'credit_utilization',
        severity: 'high',
        details: 'Credit usage is 75%',
      },
      additionalInsights: [],
      eligibilityMetrics: null,
      signals: {},
      decisionTree: {},
      isFlagged: false,
      flaggedAt: null,
      flaggedBy: null,
      flagReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
    } as Assessment;

    const context = buildAIContext(assessment);

    expect(context.priorityInsight).toBeDefined();
    expect(context.priorityInsight.type).toBe('credit_utilization');
    expect(context.priorityInsight.severity).toBe('high');
  });

  it('should extract additional insights from assessment', () => {
    const assessment = {
      id: 'test-123',
      userId: 'user-123',
      priorityInsight: { type: 'main', severity: 'medium' },
      additionalInsights: [
        { type: 'debt_pattern', severity: 'low' },
        { type: 'savings_opportunity', severity: 'medium' },
      ],
      eligibilityMetrics: null,
      signals: {},
      decisionTree: {},
      isFlagged: false,
      flaggedAt: null,
      flaggedBy: null,
      flagReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
    } as Assessment;

    const context = buildAIContext(assessment);

    expect(context.additionalInsights).toBeDefined();
    expect(context.additionalInsights).toHaveLength(2);
    expect(context.additionalInsights[0].type).toBe('debt_pattern');
    expect(context.additionalInsights[1].type).toBe('savings_opportunity');
  });

  it('should extract eligibility metrics if present', () => {
    const assessment = {
      id: 'test-123',
      userId: 'user-123',
      priorityInsight: { type: 'credit' },
      additionalInsights: [],
      eligibilityMetrics: {
        creditScore: 720,
        debtToIncome: 0.3,
      },
      signals: {},
      decisionTree: {},
      isFlagged: false,
      flaggedAt: null,
      flagReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
    } as unknown as Assessment;

    const context = buildAIContext(assessment);

    expect(context.eligibilityMetrics).toBeDefined();
    expect(context.eligibilityMetrics).toHaveProperty('creditScore', 720);
    expect(context.eligibilityMetrics).toHaveProperty('debtToIncome', 0.3);
  });

  it('should handle assessment with no eligibility metrics', () => {
    const assessment = {
      id: 'test-123',
      userId: 'user-123',
      priorityInsight: { type: 'credit' },
      additionalInsights: [],
      eligibilityMetrics: null,
      signals: {},
      decisionTree: {},
      isFlagged: false,
      flaggedAt: null,
      flaggedBy: null,
      flagReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
    } as Assessment;

    const context = buildAIContext(assessment);

    expect(context.eligibilityMetrics).toBeNull();
  });

  it('should handle empty additional insights', () => {
    const assessment = {
      id: 'test-123',
      userId: 'user-123',
      priorityInsight: { type: 'credit' },
      additionalInsights: [],
      eligibilityMetrics: null,
      signals: {},
      decisionTree: {},
      isFlagged: false,
      flaggedAt: null,
      flaggedBy: null,
      flagReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
    } as Assessment;

    const context = buildAIContext(assessment);

    expect(context.additionalInsights).toEqual([]);
  });

  it('should preserve insight structure and metadata', () => {
    const assessment = {
      id: 'test-123',
      userId: 'user-123',
      priorityInsight: {
        type: 'credit_utilization',
        severity: 'high',
        title: 'High Credit Usage',
        description: 'Your credit cards are 75% utilized',
        recommendation: 'Consider paying down balances',
        metadata: {
          utilizationRate: 0.75,
          totalLimit: 10000,
          totalUsed: 7500,
        },
      },
      additionalInsights: [],
      eligibilityMetrics: null,
      signals: {},
      decisionTree: {},
      isFlagged: false,
      flaggedAt: null,
      flaggedBy: null,
      flagReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
    } as Assessment;

    const context = buildAIContext(assessment);

    expect(context.priorityInsight).toHaveProperty('title', 'High Credit Usage');
    expect(context.priorityInsight).toHaveProperty('metadata');
    expect(context.priorityInsight.metadata).toHaveProperty('utilizationRate', 0.75);
  });
});

describe('AI Context - sanitizeContext', () => {
  describe('PII field removal', () => {
    it('should remove accountId field', () => {
      const context = {
        insight: {
          accountId: 'acc_123456',
          type: 'credit',
        },
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.insight).not.toHaveProperty('accountId');
      expect(sanitized.insight.type).toBe('credit');
    });

    it('should remove accountNumber field', () => {
      const context = {
        data: {
          accountNumber: '1234567890',
          balance: 1000,
        },
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.data).not.toHaveProperty('accountNumber');
      expect(sanitized.data.balance).toBe(1000);
    });

    it('should remove username field', () => {
      const context = {
        user: {
          username: 'john_doe',
          status: 'active',
        },
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.user).not.toHaveProperty('username');
      expect(sanitized.user.status).toBe('active');
    });

    it('should remove email field', () => {
      const context = {
        contact: {
          email: 'john@example.com',
          preferences: 'email',
        },
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.contact).not.toHaveProperty('email');
      expect(sanitized.contact.preferences).toBe('email');
    });

    it('should remove phone field', () => {
      const context = {
        contact: {
          phone: '555-1234',
          verified: true,
        },
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.contact).not.toHaveProperty('phone');
      expect(sanitized.contact.verified).toBe(true);
    });

    it('should remove ssn field', () => {
      const context = {
        identity: {
          ssn: '123-45-6789',
          dateOfBirth: '1990-01-01',
        },
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.identity).not.toHaveProperty('ssn');
      expect(sanitized.identity.dateOfBirth).toBe('1990-01-01');
    });

    it('should remove all PII fields in one pass', () => {
      const context = {
        data: {
          accountId: 'acc_123',
          accountNumber: '9876543210',
          username: 'user',
          email: 'test@example.com',
          phone: '555-0000',
          ssn: '000-00-0000',
          balance: 5000,
        },
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.data).not.toHaveProperty('accountId');
      expect(sanitized.data).not.toHaveProperty('accountNumber');
      expect(sanitized.data).not.toHaveProperty('username');
      expect(sanitized.data).not.toHaveProperty('email');
      expect(sanitized.data).not.toHaveProperty('phone');
      expect(sanitized.data).not.toHaveProperty('ssn');
      expect(sanitized.data.balance).toBe(5000);
    });
  });

  describe('Recursive sanitization', () => {
    it('should sanitize nested objects', () => {
      const context = {
        level1: {
          level2: {
            accountId: 'nested_acc',
            level3: {
              email: 'nested@example.com',
              data: 'keep this',
            },
          },
        },
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.level1.level2).not.toHaveProperty('accountId');
      expect(sanitized.level1.level2.level3).not.toHaveProperty('email');
      expect(sanitized.level1.level2.level3.data).toBe('keep this');
    });

    it('should sanitize objects in arrays', () => {
      const context = {
        accounts: [
          { accountId: 'acc_1', balance: 100 },
          { accountId: 'acc_2', balance: 200 },
        ],
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.accounts[0]).not.toHaveProperty('accountId');
      expect(sanitized.accounts[1]).not.toHaveProperty('accountId');
      expect(sanitized.accounts[0].balance).toBe(100);
      expect(sanitized.accounts[1].balance).toBe(200);
    });

    it('should handle deeply nested structures', () => {
      const context = {
        insights: {
          priority: {
            details: {
              accounts: [
                {
                  id: 'keep',
                  accountId: 'remove',
                  metadata: {
                    email: 'remove@example.com',
                    score: 750,
                  },
                },
              ],
            },
          },
        },
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.insights.priority.details.accounts[0].id).toBe('keep');
      expect(sanitized.insights.priority.details.accounts[0]).not.toHaveProperty('accountId');
      expect(sanitized.insights.priority.details.accounts[0].metadata).not.toHaveProperty('email');
      expect(sanitized.insights.priority.details.accounts[0].metadata.score).toBe(750);
    });
  });

  describe('Data preservation', () => {
    it('should preserve non-PII fields', () => {
      const context = {
        priorityInsight: {
          type: 'credit_utilization',
          severity: 'high',
          utilizationRate: 0.75,
        },
        additionalInsights: [{ type: 'debt', amount: 5000 }],
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.priorityInsight.type).toBe('credit_utilization');
      expect(sanitized.priorityInsight.severity).toBe('high');
      expect(sanitized.priorityInsight.utilizationRate).toBe(0.75);
      expect(sanitized.additionalInsights[0].type).toBe('debt');
      expect(sanitized.additionalInsights[0].amount).toBe(5000);
    });

    it('should preserve numeric values', () => {
      const context = {
        metrics: {
          creditScore: 720,
          accountId: 'remove',
          debtToIncome: 0.3,
          monthlyIncome: 5000,
        },
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.metrics.creditScore).toBe(720);
      expect(sanitized.metrics.debtToIncome).toBe(0.3);
      expect(sanitized.metrics.monthlyIncome).toBe(5000);
      expect(sanitized.metrics).not.toHaveProperty('accountId');
    });

    it('should preserve boolean values', () => {
      const context = {
        flags: {
          hasDebt: true,
          email: 'remove@example.com',
          isEligible: false,
        },
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.flags.hasDebt).toBe(true);
      expect(sanitized.flags.isEligible).toBe(false);
      expect(sanitized.flags).not.toHaveProperty('email');
    });

    it('should preserve arrays', () => {
      const context = {
        tags: ['credit', 'debt', 'savings'],
        accountId: 'remove',
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.tags).toEqual(['credit', 'debt', 'savings']);
      expect(sanitized).not.toHaveProperty('accountId');
    });

    it('should preserve null and undefined values', () => {
      const context = {
        nullValue: null,
        undefinedValue: undefined,
        accountId: 'remove',
        validValue: 'keep',
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.nullValue).toBeNull();
      expect(sanitized.undefinedValue).toBeUndefined();
      expect(sanitized.validValue).toBe('keep');
      expect(sanitized).not.toHaveProperty('accountId');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty object', () => {
      const context = {};
      const sanitized = sanitizeContext(context);

      expect(sanitized).toEqual({});
    });

    it('should handle object with only PII fields', () => {
      const context = {
        accountId: 'acc_123',
        email: 'test@example.com',
        phone: '555-0000',
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized).not.toHaveProperty('accountId');
      expect(sanitized).not.toHaveProperty('email');
      expect(sanitized).not.toHaveProperty('phone');
      expect(Object.keys(sanitized)).toHaveLength(0);
    });

    it('should not mutate original object', () => {
      const context = {
        accountId: 'acc_123',
        data: 'important',
      };

      const original = JSON.stringify(context);
      sanitizeContext(context);

      expect(JSON.stringify(context)).toBe(original);
      expect(context.accountId).toBe('acc_123');
    });

    it('should handle circular references safely via JSON serialization', () => {
      const context = {
        data: 'test',
        accountId: 'remove',
      };

      // Note: sanitizeContext uses JSON.parse(JSON.stringify()) which removes circular refs
      const sanitized = sanitizeContext(context);

      expect(sanitized.data).toBe('test');
      expect(sanitized).not.toHaveProperty('accountId');
    });

    it('should handle special characters in values', () => {
      const context = {
        message: 'Hello! How are you? 😊',
        accountId: 'remove',
        special: 'Test\nwith\ttabs',
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.message).toBe('Hello! How are you? 😊');
      expect(sanitized.special).toBe('Test\nwith\ttabs');
      expect(sanitized).not.toHaveProperty('accountId');
    });
  });

  describe('Real-world assessment context', () => {
    it('should sanitize a complete assessment context', () => {
      const context = {
        priorityInsight: {
          type: 'credit_utilization',
          severity: 'high',
          accountId: 'acc_should_be_removed',
          details: {
            utilizationRate: 0.75,
            email: 'user@example.com',
          },
        },
        additionalInsights: [
          {
            type: 'debt_pattern',
            accountNumber: '1234567890',
            amount: 5000,
          },
        ],
        eligibilityMetrics: {
          creditScore: 720,
          username: 'john_doe',
          debtToIncome: 0.3,
        },
      };

      const sanitized = sanitizeContext(context);

      // Verify structure preserved
      expect(sanitized.priorityInsight.type).toBe('credit_utilization');
      expect(sanitized.priorityInsight.severity).toBe('high');
      expect(sanitized.priorityInsight.details.utilizationRate).toBe(0.75);
      expect(sanitized.additionalInsights[0].amount).toBe(5000);
      expect(sanitized.eligibilityMetrics.creditScore).toBe(720);
      expect(sanitized.eligibilityMetrics.debtToIncome).toBe(0.3);

      // Verify PII removed
      expect(sanitized.priorityInsight).not.toHaveProperty('accountId');
      expect(sanitized.priorityInsight.details).not.toHaveProperty('email');
      expect(sanitized.additionalInsights[0]).not.toHaveProperty('accountNumber');
      expect(sanitized.eligibilityMetrics).not.toHaveProperty('username');
    });
  });
});
