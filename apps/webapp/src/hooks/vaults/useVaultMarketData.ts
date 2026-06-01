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
  const morphoData = useMorphoVaultMarketApiData({ vaultAddress });

  if (provider === 'morpho') {
    return morphoData;
  }

  // Spark and future providers route here (slice 04).
  return morphoData;
}
