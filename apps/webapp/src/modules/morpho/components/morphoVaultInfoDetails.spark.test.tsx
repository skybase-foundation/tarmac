/// <reference types="vite/client" />

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WagmiWrapper } from '../../../../test/widgets/WagmiWrapper';

const VAULT = '0x74cb54e082411cfCAEADb00a0765625B10410DAa';

// The detail "Vault info" panel must be provider-aware: Morpho reads its market
// API; non-Morpho providers (Spark) read on-chain ERC-4626 data. Drive both seam
// hooks from the test so we assert the *observable* values rendered, not wiring.
let mockMarketData: { data: unknown; isLoading: boolean; error: Error | null } = {
  data: undefined,
  isLoading: false,
  error: null
};
let mockOnChainData: { data: unknown; isLoading: boolean; error: Error | null } = {
  data: undefined,
  isLoading: false,
  error: null
};

vi.mock('@/hooks', async importActual => {
  const actual = await importActual<typeof import('@/hooks')>();
  return {
    ...actual,
    useMorphoVaultMarketApiData: () => mockMarketData,
    useErc4626VaultData: () => mockOnChainData
  };
});

import { MorphoVaultInfoDetails } from './MorphoVaultInfoDetails';
import { TOKENS } from '@/hooks';

describe('MorphoVaultInfoDetails (provider-aware)', () => {
  it('renders on-chain TVL + on-chain maxWithdraw liquidity + 0% fees for a Spark vault', async () => {
    // Spark: on-chain ERC-4626 data feeds the panel; the Morpho API is never consulted.
    mockMarketData = { data: undefined, isLoading: false, error: null };
    mockOnChainData = {
      data: {
        totalAssets: 250_000_000_000_000n, // 250M USDT (6 decimals)
        maxWithdraw: 40_000_000_000_000n // 40M USDT withdrawable now
      },
      isLoading: false,
      error: null
    };

    render(<MorphoVaultInfoDetails vaultAddress={VAULT} assetToken={TOKENS.usdt} provider="spark" />, {
      wrapper: WagmiWrapper
    });

    expect((await screen.findByTestId('vault-info-tvl')).textContent).toContain('250,000,000');
    expect(screen.getByTestId('vault-info-liquidity').textContent).toContain('40,000,000');
    // Spark surfaces a single net APY — no fee split — so both fees read a truthful 0%.
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(2);
    // No error/degraded state: the panel never hit the (empty) Morpho API.
    expect(screen.queryByText(/Unable to fetch data/i)).toBeNull();
  });

  it('renders API-sourced TVL, liquidity, and fees for a Morpho vault (unchanged)', async () => {
    // Morpho: market API feeds the panel; the on-chain hook is never consulted.
    mockOnChainData = { data: undefined, isLoading: false, error: null };
    mockMarketData = {
      data: {
        totalAssets: 500_000_000_000_000n, // 500M (6 decimals)
        liquidity: 90_000_000_000_000n, // 90M available
        rate: { formattedManagementFee: '5%', formattedPerformanceFee: '10%' }
      },
      isLoading: false,
      error: null
    };

    render(<MorphoVaultInfoDetails vaultAddress={VAULT} assetToken={TOKENS.usdt} provider="morpho" />, {
      wrapper: WagmiWrapper
    });

    expect((await screen.findByTestId('vault-info-tvl')).textContent).toContain('500,000,000');
    expect(screen.getByTestId('vault-info-liquidity').textContent).toContain('90,000,000');
    expect(screen.getByText('5%')).toBeTruthy();
    expect(screen.getByText('10%')).toBeTruthy();
  });
});
