import {
  useMorphoVaultMarketApiData,
  type MorphoVaultMarketDataHook
} from '../morpho/useMorphoVaultMarketApiData';
import type { VaultProvider } from './types';

/** Normalized market-data shape consumed across providers. */
export type VaultMarketDataHook = MorphoVaultMarketDataHook;

export type UseVaultMarketDataParams = {
  provider: VaultProvider;
  vaultAddress?: `0x${string}`;
};

/**
 * Provider-neutral dispatcher for vault market data (rate / TVL / allocations).
 *
 * Routes to the provider's data source and returns a normalized shape.
 * Today only Morpho is wired; the Spark source lands in slice 04 and routes
 * here under `provider: 'spark'`. Hooks must run unconditionally, so the
 * Morpho hook is always invoked while only Morpho is implemented.
 */
export function useVaultMarketData({
  provider,
  vaultAddress
}: UseVaultMarketDataParams): VaultMarketDataHook {
  // Only the Morpho source is wired today. For other providers we pass an
  // undefined address so the Morpho query stays disabled (no wrong-provider
  // fetch) and the hook returns a clean empty/non-loading state. Slice 04
  // replaces this fall-through with the real Spark source.
  const morphoData = useMorphoVaultMarketApiData({
    vaultAddress: provider === 'morpho' ? vaultAddress : undefined
  });

  return morphoData;
}
