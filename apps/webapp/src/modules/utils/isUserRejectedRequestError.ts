type WalletErrorCandidate = {
  code?: number | string;
  cause?: {
    code?: number | string;
  };
  name?: string;
  message?: string;
};

export function isUserRejectedRequestError(error: unknown): boolean {
  const candidate = error as WalletErrorCandidate;
  const errorCodes = [candidate?.code, candidate?.cause?.code].filter(Boolean).map(String);
  const errorName = candidate?.name || '';
  const errorMessage = candidate?.message || '';
  const combinedText = `${errorName} ${errorMessage}`;

  if (errorCodes.includes('4001')) return true;
  if (errorCodes.includes('ACTION_REJECTED')) return true;
  if (combinedText.includes('UserRejectedRequestError')) return true;
  if (/user rejected|rejected the request|user denied/i.test(combinedText)) return true;
  // Wallet SDKs that render their own connect modal (MetaMask Connect multichain,
  // Binance Web3 Wallet) reject with "User closed modal" / "[binance-w3w] User
  // closed modal" when the user dismisses it — the modal-based equivalent of a
  // 4001 rejection, not an app error (WEBAPP-6R).
  if (/user closed modal/i.test(combinedText)) return true;

  return false;
}
