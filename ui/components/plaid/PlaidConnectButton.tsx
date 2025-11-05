/**
 * Plaid Connect Button Component
 *
 * Opens Plaid Link modal for bank account connection
 */

import { usePlaidConnection } from '../../lib/plaid';
import type { PlaidLinkOnSuccess } from 'react-plaid-link';

interface PlaidConnectButtonProps {
  linkToken: string;
  onSuccess: PlaidLinkOnSuccess;
  disabled?: boolean;
}

export default function PlaidConnectButton({
  linkToken,
  onSuccess,
  disabled,
}: PlaidConnectButtonProps) {
  const { open, ready, error } = usePlaidConnection(linkToken, onSuccess);

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        Unable to initialize Plaid Link: {error.message}
      </div>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready || disabled || !linkToken}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
    >
      {!linkToken
        ? 'No Link Token'
        : ready
        ? 'Connect Bank Account'
        : 'Loading...'}
    </button>
  );
}
