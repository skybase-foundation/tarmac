import { useQuery } from '@tanstack/react-query';
import { mainnet } from 'viem/chains';
import { TRUST_LEVELS, TrustLevelEnum } from '../../constants';
import type { MorphoVaultRateData } from '../../morpho/useMorphoVaultRateApiData';
import type {
  NormalizedVaultAllocation,
  NormalizedVaultHistoryPoint,
  NormalizedVaultMarketData,
  VaultMarketDataHook
} from '../useVaultMarketData';
import { SPARK_VAULT_API_URL } from './constants';

/**
 * One allocation bucket as the Spark upstream is expected to expose it.
 * @see SparkVaultApiPayload
 */
export type SparkVaultApiAllocation = {
  /** Human-readable label for the allocation bucket */
  name: string;
  /** Allocated assets in the smallest asset unit, as a string to preserve precision */
  assets: string;
  /** Allocated assets in USD */
  assetsUsd?: number;
};

/**
 * One TVL/rate history point as the Spark upstream is expected to expose it.
 * @see SparkVaultApiPayload
 */
export type SparkVaultApiHistoryPoint = {
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Total assets (TVL) at that point, in the smallest asset unit, as a string */
  totalAssets: string;
  /** Total assets at that point in USD */
  totalAssetsUsd?: number;
  /** Net APY at that point, as a decimal (e.g. 0.05 = 5%) */
  apy?: number;
};

/**
 * Documented upstream contract for the Spark vault-data endpoint.
 *
 * This is the interface the data layer is built against; the live Spark payload
 * may differ in detail (net-vs-gross APY, wrapping envelope) — the open question
 * tracked in APP-266. `normalizeSparkVaultPayload` maps defensively so a later
 * shape tweak stays localized to this file.
 *
 * `apy` is treated as the NET rate users see (Spark allocates yield via the ALM
 * backend; there is no separate performance/management fee surfaced to the app).
 */
export type SparkVaultApiPayload = {
  /** Net APY as a decimal (e.g. 0.0531 = 5.31%) */
  apy?: number;
  /** Total assets (TVL) in the smallest asset unit, as a string */
  totalAssets?: string;
  /** Total assets in USD */
  totalAssetsUsd?: number;
  /** Optional allocation breakdown */
  allocations?: SparkVaultApiAllocation[];
  /** Optional TVL/rate history series for the metrics chart */
  history?: SparkVaultApiHistoryPoint[];
};

function formatRate(apy: number): string {
  return `${(apy * 100).toFixed(2)}%`;
}

/** Parse a decimal-string asset amount to bigint, returning undefined on garbage. */
function parseAssets(value: string | undefined): bigint | undefined {
  if (value === undefined) return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

function normalizeRate(apy: number | undefined, vaultAddress: string): MorphoVaultRateData | undefined {
  if (apy === undefined || Number.isNaN(apy)) return undefined;
  // Spark surfaces a single net APY; no fees/rewards are exposed to the app, so
  // gross and net are the same and fee fields are zeroed.
  return {
    address: vaultAddress,
    rate: apy,
    netRate: apy,
    managementFee: 0,
    performanceFee: 0,
    formattedRate: formatRate(apy),
    formattedNetRate: formatRate(apy),
    formattedManagementFee: '0%',
    formattedPerformanceFee: '0%',
    rewards: []
  };
}

function normalizeAllocations(
  allocations: SparkVaultApiAllocation[] | undefined,
  totalAssets: bigint | undefined
): NormalizedVaultAllocation[] | undefined {
  if (!allocations || allocations.length === 0) return undefined;

  const normalized: NormalizedVaultAllocation[] = [];
  for (const allocation of allocations) {
    const assets = parseAssets(allocation.assets);
    if (assets === undefined) continue;
    normalized.push({
      name: allocation.name,
      assets,
      assetsUsd: allocation.assetsUsd,
      allocationPercent:
        totalAssets !== undefined && totalAssets > 0n ? Number(assets) / Number(totalAssets) : undefined
    });
  }

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeHistory(
  history: SparkVaultApiHistoryPoint[] | undefined
): NormalizedVaultHistoryPoint[] | undefined {
  if (!history || history.length === 0) return undefined;

  const normalized: NormalizedVaultHistoryPoint[] = [];
  for (const point of history) {
    const amount = parseAssets(point.totalAssets);
    // A point without a parseable TVL or timestamp can't be plotted — drop it.
    if (amount === undefined || typeof point.timestamp !== 'number' || Number.isNaN(point.timestamp)) {
      continue;
    }
    normalized.push({
      blockTimestamp: point.timestamp,
      amount,
      amountUsd: point.totalAssetsUsd ?? 0,
      apy: point.apy !== undefined && !Number.isNaN(point.apy) ? point.apy : undefined
    });
  }

  return normalized.length > 0 ? normalized : undefined;
}

/**
 * Map a raw Spark payload into the provider-neutral normalized shape.
 *
 * Defensive: a payload missing fields yields `undefined` for those fields rather
 * than throwing, and an entirely empty payload yields `undefined` so the hook
 * surfaces a clean empty state.
 */
export function normalizeSparkVaultPayload(
  payload: SparkVaultApiPayload | null | undefined,
  vaultAddress: string
): NormalizedVaultMarketData | undefined {
  if (!payload) return undefined;

  const totalAssets = parseAssets(payload.totalAssets);
  const rate = normalizeRate(payload.apy, vaultAddress);
  const allocations = normalizeAllocations(payload.allocations, totalAssets);
  const history = normalizeHistory(payload.history);

  // Nothing usable in the payload — treat as empty.
  if (rate === undefined && totalAssets === undefined && allocations === undefined && history === undefined) {
    return undefined;
  }

  return {
    rate,
    totalAssets,
    totalAssetsUsd: payload.totalAssetsUsd,
    // Spark has no market-API liquidity; the widget caps withdrawals via the
    // on-chain `maxWithdraw` (slice 03). Leaving this undefined keeps the stats
    // card's Liquidity row blank ("—") rather than showing a misleading 0.
    liquidity: undefined,
    allocations,
    history
  };
}

async function fetchSparkVaultData(vaultAddress: string): Promise<NormalizedVaultMarketData | undefined> {
  const response = await fetch(SPARK_VAULT_API_URL);

  if (!response.ok) {
    throw new Error(`Spark API error: ${response.status}`);
  }

  const payload: SparkVaultApiPayload = await response.json();
  return normalizeSparkVaultPayload(payload, vaultAddress);
}

/**
 * Spark vault rate/TVL/allocations source, mirroring `useMorphoVaultMarketApiData`.
 *
 * Reads from the `SPARK_VAULT_API_URL` code constant and returns the normalized
 * shape consumed by `useVaultMarketData`. While the endpoint is an unset
 * placeholder the fetch fails and the hook returns a clean empty/non-loading
 * state (no crash, no toast) — the query error is surfaced only via the `error`
 * field, which the vault UI does not toast on.
 *
 * @param vaultAddress - The Spark vault contract address (optional; omit to disable)
 */
export function useSparkVaultApiData({
  vaultAddress
}: {
  vaultAddress?: `0x${string}`;
}): VaultMarketDataHook {
  // Spark sUSDT is mainnet-only; pin the chainId so the cache key is stable
  // across network switches (same rationale as the Morpho hooks).
  const chainId = mainnet.id;

  const {
    data,
    error,
    refetch: mutate,
    isLoading
  } = useQuery({
    queryKey: ['spark-vault-market-data', vaultAddress, chainId],
    queryFn: () => {
      if (!vaultAddress) {
        throw new Error('Vault address is required');
      }
      return fetchSparkVaultData(vaultAddress);
    },
    enabled: !!vaultAddress,
    staleTime: 30_000,
    gcTime: 60_000
  });

  return {
    data,
    isLoading: !data && isLoading,
    error: error as Error | null,
    mutate,
    dataSources: [
      {
        title: 'Spark API',
        href: SPARK_VAULT_API_URL,
        onChain: false,
        trustLevel: TRUST_LEVELS[TrustLevelEnum.TWO]
      }
    ]
  };
}
