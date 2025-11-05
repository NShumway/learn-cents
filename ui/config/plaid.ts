/**
 * Plaid Configuration for SANDBOX mode
 *
 * IMPORTANT: This uses Plaid Sandbox for development/testing.
 * Production Plaid setup happens in Phase 4.
 */

export const PLAID_CONFIG = {
  clientName: 'Learning Cents',
  env: 'sandbox' as const,
  products: ['transactions'] as const,
  countryCodes: ['US'] as const,
  language: 'en' as const,
};

// Sandbox link token (will be generated server-side in Phase 4)
// For now, this is a placeholder - you'll need to generate a real sandbox token
export const SANDBOX_LINK_TOKEN = import.meta.env.VITE_PLAID_SANDBOX_LINK_TOKEN || '';
