import { MorphoVaultTvlCard } from './MorphoVaultTvlCard';
import { MorphoMarketLiquidityCard } from './MorphoMarketLiquidityCard';
import { Token, useErc4626VaultData, useMorphoVaultMarketApiData, VaultProvider } from '@/hooks';
import { StatsCard } from '@/modules/ui/components/StatsCard';
import { t } from '@lingui/core/macro';
import { Text } from '@/modules/layout/components/Typography';

type MorphoVaultInfoDetailsProps = {
  vaultAddress: `0x${string}`;
  assetToken: Token;
  /** Which provider operates the vault — drives the data source. Defaults to Morpho. */
  provider?: VaultProvider;
};

export function MorphoVaultInfoDetails({
  vaultAddress,
  assetToken,
  provider = 'morpho'
}: MorphoVaultInfoDetailsProps) {
  const isMorpho = provider === 'morpho';

  // Provider seam: Morpho reads its market API; non-Morpho providers (Spark) read
  // the same on-chain ERC-4626 data the in-widget card uses. Rules of Hooks forbid
  // conditional hooks, so both run every render and the inactive one is handed
  // `vaultAddress: undefined` to keep its query disabled (no wrong-provider fetch).
  const {
    data: marketData,
    isLoading: isMarketLoading,
    error: marketError
  } = useMorphoVaultMarketApiData({ vaultAddress: isMorpho ? vaultAddress : undefined });
  const {
    data: onChainData,
    isLoading: isOnChainLoading,
    error: onChainError
  } = useErc4626VaultData({ vaultAddress: isMorpho ? undefined : vaultAddress, provider });

  // TVL: Morpho's API total assets vs on-chain ERC-4626 `totalAssets`.
  const totalAssets = isMorpho ? marketData?.totalAssets : onChainData?.totalAssets;
  // Available liquidity is Provider-defined (see CONTEXT.md): Morpho's market-API
  // `liquidity` vs Spark's on-chain `maxWithdraw(user)` (the un-deployed buffer).
  const liquidity = isMorpho ? marketData?.liquidity : onChainData?.maxWithdraw;
  const isLoading = isMorpho ? isMarketLoading : isOnChainLoading;
  const error = isMorpho ? marketError : onChainError;

  // Spark surfaces a single net APY — there is no fee split — so both fees are a
  // truthful 0% rather than the Morpho API's (absent) values.
  const managementFee = isMorpho ? (marketData?.rate.formattedManagementFee ?? '-') : '0%';
  const performanceFee = isMorpho ? (marketData?.rate.formattedPerformanceFee ?? '-') : '0%';

  return (
    <div className="flex w-full flex-wrap gap-3">
      <div className="min-w-[250px] flex-1">
        <MorphoVaultTvlCard
          totalAssets={totalAssets}
          isLoading={isLoading}
          error={error}
          assetToken={assetToken}
        />
      </div>
      <div className="min-w-[250px] flex-1">
        <MorphoMarketLiquidityCard
          liquidity={liquidity}
          isLoading={isLoading}
          error={error}
          assetToken={assetToken}
        />
      </div>
      <div className="min-w-[250px] flex-1">
        <StatsCard
          className="h-full"
          title={t`Management Fee`}
          content={<Text className="mt-2">{managementFee}</Text>}
          isLoading={isMorpho ? isLoading : false}
          error={isMorpho ? error : null}
        />
      </div>
      <div className="min-w-[250px] flex-1">
        <StatsCard
          className="h-full"
          title={t`Performance Fee`}
          content={<Text className="mt-2">{performanceFee}</Text>}
          isLoading={isMorpho ? isLoading : false}
          error={isMorpho ? error : null}
        />
      </div>
    </div>
  );
}
