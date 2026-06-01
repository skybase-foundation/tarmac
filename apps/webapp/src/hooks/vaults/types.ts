import { Token } from '../tokens/types';

/** Vault data provider. Morpho today; Spark (sUSDT) added in APP-266. */
export type VaultProvider = 'morpho' | 'spark';

/**
 * Provider-neutral vault configuration.
 * The vault address (per chain) doubles as the unique identifier.
 */
export type VaultConfig = {
  /** Which provider supplies this vault's data and branding */
  provider: VaultProvider;
  /** Display name for the vault */
  name: string;
  /** The vault contract address mapping by chain ID (also the unique identifier) */
  vaultAddress: Record<number, `0x${string}`>;
  /** The underlying asset token */
  assetToken: Token;
};
