/**
 * Simple in-memory rate limiter for API endpoints
 *
 * For production at scale, consider using:
 * - Redis for distributed rate limiting
 * - Upstash Rate Limit (@upstash/ratelimit)
 * - Vercel Edge Config
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on function cold start)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Optional: Custom key generator function
   * Default uses userId
   */
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Number of requests remaining in current window
   */
  remaining: number;

  /**
   * Timestamp when the rate limit resets
   */
  resetAt: number;

  /**
   * Time in seconds until rate limit resets
   */
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (usually userId)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier;
  const now = Date.now();

  // Get or create entry
  let entry = store.get(key);

  // Reset if window has passed
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    store.set(key, entry);
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  // Increment counter
  entry.count++;

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * AI Chat: 20 requests per 5 minutes per user
   * Prevents cost abuse while allowing normal conversation
   */
  AI_CHAT: {
    maxRequests: 20,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },

  /**
   * API Default: 100 requests per minute per user
   * Standard rate limit for most API endpoints
   */
  API_DEFAULT: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },

  /**
   * Strict: 10 requests per minute per user
   * For expensive operations
   */
  STRICT: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or admin overrides
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(identifier: string, config: RateLimitConfig): RateLimitResult {
  const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }

  const remaining = config.maxRequests - entry.count;

  if (remaining <= 0) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  return {
    allowed: true,
    remaining,
    resetAt: entry.resetAt,
  };
}
