import { describe, it, expect } from 'vitest';
import { buildVaultDeepLinkMap } from './VaultsBalanceCard';
import { SPARK_USDT_VAULT_ADDRESS } from '@/hooks/vaults/spark/constants';

const MORPHO_ADDRESS = '0x1234567890123456789012345678901234567890' as const;
const BASE_URL = '/?network=ethereum&widget=vaults';

describe('buildVaultDeepLinkMap', () => {
  it('derives vault_module=spark for a Spark vault from its provider', () => {
    const map = buildVaultDeepLinkMap(BASE_URL, [
      { vaultAddress: SPARK_USDT_VAULT_ADDRESS, vault: { provider: 'spark' } }
    ]);
    expect(map[SPARK_USDT_VAULT_ADDRESS]).toBe(
      `${BASE_URL}&vault=${SPARK_USDT_VAULT_ADDRESS}&vault_module=spark`
    );
  });

  it('derives vault_module=morpho for a Morpho vault (unchanged behaviour)', () => {
    const map = buildVaultDeepLinkMap(BASE_URL, [
      { vaultAddress: MORPHO_ADDRESS, vault: { provider: 'morpho' } }
    ]);
    expect(map[MORPHO_ADDRESS]).toBe(`${BASE_URL}&vault=${MORPHO_ADDRESS}&vault_module=morpho`);
  });

  it('routes each vault to its own provider when both are present', () => {
    const map = buildVaultDeepLinkMap(BASE_URL, [
      { vaultAddress: MORPHO_ADDRESS, vault: { provider: 'morpho' } },
      { vaultAddress: SPARK_USDT_VAULT_ADDRESS, vault: { provider: 'spark' } }
    ]);
    expect(map[MORPHO_ADDRESS]).toContain('vault_module=morpho');
    expect(map[SPARK_USDT_VAULT_ADDRESS]).toContain('vault_module=spark');
  });

  it('uses ? as the separator when the base url has no query string', () => {
    const map = buildVaultDeepLinkMap('/vaults', [
      { vaultAddress: SPARK_USDT_VAULT_ADDRESS, vault: { provider: 'spark' } }
    ]);
    expect(map[SPARK_USDT_VAULT_ADDRESS]).toBe(
      `/vaults?vault=${SPARK_USDT_VAULT_ADDRESS}&vault_module=spark`
    );
  });

  it('maps every vault to an empty string when no base url is provided', () => {
    const map = buildVaultDeepLinkMap(undefined, [
      { vaultAddress: SPARK_USDT_VAULT_ADDRESS, vault: { provider: 'spark' } }
    ]);
    expect(map[SPARK_USDT_VAULT_ADDRESS]).toBe('');
  });
});
