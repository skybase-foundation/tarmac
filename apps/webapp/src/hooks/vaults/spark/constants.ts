import { mainnet } from 'wagmi/chains';
import { TENDERLY_CHAIN_ID } from '../../constants';
import { TOKENS } from '../../tokens/tokens.constants';
import { VaultConfig } from '../types';

/**
 * Tether Savings (sUSDT) `SparkVault` — the only Spark contract the webapp touches.
 * Verified ERC-4626 proxy; upgrade authority = Sky governance Pause Proxy (APP-266,
 * address pre-cleared). Underlying asset is USDT (6 decimals). Same address on
 * mainnet and the Tenderly fork.
 */
export const SPARK_USDT_VAULT_ADDRESS = '0x74cb54e082411cfCAEADb00a0765625B10410DAa' as const;

/**
 * Spark vault-data endpoint. Same pattern as `MORPHO_API_URL`: a hardcoded code
 * constant, NOT an env var or proxy — no operator config to ship this slice.
 *
 * This is a documented PLACEHOLDER. Spark has not yet delivered the live endpoint
 * (tracked in the APP-266 Spark/Ozone Slack group). When they do, pointing the
 * vault at real data is a one-line change to this constant; the data layer is
 * already built against the `SparkVaultApiPayload` → normalized mapping. Until
 * then the fetch fails fast and the dispatcher returns a clean empty state.
 */
export const SPARK_VAULT_API_URL = 'https://api.sky.money/spark/vaults/susdt';

/**
 * Spark vaults registered in the app. Today only Tether Savings (sUSDT).
 * Fed into the unified vault list alongside `MORPHO_VAULTS`.
 */
export const SPARK_VAULTS: VaultConfig[] = [
  {
    provider: 'spark',
    name: 'Tether Savings',
    symbol: 'sUSDT',
    vaultAddress: {
      [mainnet.id]: SPARK_USDT_VAULT_ADDRESS,
      [TENDERLY_CHAIN_ID]: SPARK_USDT_VAULT_ADDRESS
    },
    assetToken: TOKENS.usdt
  }
];
