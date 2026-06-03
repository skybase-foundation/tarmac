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
 * Host for the live Spark Savings Data API (public, read-only, no auth). This is
 * the single swappable config point: moving these calls from `api.spark.fi` to
 * our own proxy (e.g. `api.sky.money` / Sky BA endpoints, per ADR-0001's deferred
 * host decision) is a one-value edit here — the client owns path construction and
 * everything downstream depends on the normalized shape, not the URL.
 */
export const SPARK_SAVINGS_API_HOST = 'https://api.spark.fi';

/**
 * Path identity for our vault: `sky / mainnet / usdt` (→ `sUSDT`, "Tether
 * Savings"). NOT `spark/.../usdt` — that is Spark's own `spUSDT` product. The
 * client builds `/v1/savings/{protocol}/{chain}/{token}` from this.
 */
export const SPARK_VAULT_IDENTITY = { protocol: 'sky', chain: 'mainnet', token: 'usdt' } as const;

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
