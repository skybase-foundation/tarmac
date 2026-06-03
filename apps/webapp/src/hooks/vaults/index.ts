export { type VaultProvider, type VaultConfig } from './types';
export { VAULTS, getVaultByAddress } from './constants';
export {
  SPARK_VAULTS,
  SPARK_USDT_VAULT_ADDRESS,
  SPARK_SAVINGS_API_HOST,
  SPARK_VAULT_IDENTITY
} from './spark/constants';
export { useSparkVaultApiData } from './spark/useSparkVaultApiData';
export { normalizeSparkCurrentData } from './spark/normalizeSparkVaultData';
export {
  buildSparkSavingsUrl,
  fetchSparkSavingsCurrent,
  type SparkVaultIdentity,
  type SparkSavingsCurrentResponse,
  type SparkSavingsCurrentData,
  type SparkSavingsTokenInfo,
  type SparkSavingsLiquidityEntry,
  type SparkSavingsCollateralEntry,
  type SparkSavingsCollateralComposition
} from './spark/sparkSavingsApi';
export { useErc4626VaultData, type Erc4626VaultData, type Erc4626VaultDataHook } from './useErc4626VaultData';
export { useSparkVaultRate } from './spark/useSparkVaultRate';
export { useVaultRatesByAddress, type VaultRatesByAddressHook } from './useVaultRatesByAddress';
export { computeVaultLimits, type VaultLimits, type VaultLimitsInput } from './computeVaultLimits';
export {
  useVaultMarketData,
  type UseVaultMarketDataParams,
  type VaultMarketDataHook,
  type NormalizedVaultMarketData,
  type NormalizedVaultAllocation,
  type NormalizedVaultHistoryPoint
} from './useVaultMarketData';
