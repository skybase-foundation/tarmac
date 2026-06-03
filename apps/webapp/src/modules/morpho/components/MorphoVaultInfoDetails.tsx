import { MorphoVaultTvlCard } from './MorphoVaultTvlCard';
import { MorphoMarketLiquidityCard } from './MorphoMarketLiquidityCard';
import { Token, useErc4626VaultData, useVaultMarketData, VaultProvider } from '@/hooks';
import { StatsCard } from '@/modules/ui/components/StatsCard';
import { t } from '@lingui/core/macro';
import { Text } from '@/modules/layout/components/Typography';
import { useChainId, useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';

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
  const chainId = useChainId();

  // Provider seam: the dispatcher returns Morpho's market API for Morpho and
  // Spark's live Savings API (normalized) for Spark — TVL + summed liquidity[]
  // through one shape. This is the authoritative source when present.
  const {
    data: marketData,
    isLoading: marketDataLoading,
    error: marketError
  } = useVaultMarketData({ provider, vaultAddress });

  // On-chain ERC-4626 fallback for non-Morpho (Spark) when the API is empty/down.
  // Disabled for Morpho (it reads everything from its API — no extra RPC).
  const {
    data: onChainData,
    isLoading: onChainLoading,
    error: onChainError
  } = useErc4626VaultData({ vaultAddress: isMorpho ? undefined : vaultAddress, provider });

  // Vault-level liquidity fallback = the asset the vault currently holds (its
  // un-deployed buffer), matching the in-widget card so both surfaces agree on
  // what "Available liquidity" means. This VAULT-level figure is distinct from
  // the per-user `maxWithdraw` that bounds an individual withdraw input.
  const assetAddress = assetToken.address[chainId as keyof typeof assetToken.address];
  const { data: onChainLiquidity, isLoading: onChainLiquidityLoading } = useReadContract({
    address: isMorpho ? undefined : assetAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: vaultAddress ? [vaultAddress] : undefined,
    chainId,
    query: { enabled: !isMorpho && !!assetAddress && !!vaultAddress }
  });

  // TVL: API total assets when present, falling back to on-chain `totalAssets`.
  const totalAssets = marketData?.totalAssets ?? onChainData?.totalAssets;
  // Available liquidity: API vault-level figure (summed `liquidity[]`), falling
  // back to the on-chain vault buffer for Spark.
  const liquidity = marketData?.liquidity ?? onChainLiquidity;

  // Morpho tracks its API's loading/error; Spark tracks the on-chain fallback so
  // an empty/down API degrades to the on-chain figure with no error surfaced.
  const tvlLoading = isMorpho ? marketDataLoading : onChainLoading;
  const tvlError = isMorpho ? marketError : onChainError;
  const liquidityLoading = isMorpho ? marketDataLoading : onChainLiquidityLoading;

  // Spark surfaces a single net APY — there is no fee split — so both fees are a
  // truthful 0% rather than the Morpho API's (absent) values.
  const managementFee = isMorpho ? (marketData?.rate?.formattedManagementFee ?? '-') : '0%';
  const performanceFee = isMorpho ? (marketData?.rate?.formattedPerformanceFee ?? '-') : '0%';

  return (
    <div className="flex w-full flex-wrap gap-3">
      <div className="min-w-[250px] flex-1">
        <MorphoVaultTvlCard
          totalAssets={totalAssets}
          isLoading={tvlLoading}
          error={tvlError}
          assetToken={assetToken}
        />
      </div>
      <div className="min-w-[250px] flex-1">
        <MorphoMarketLiquidityCard
          liquidity={liquidity}
          isLoading={liquidityLoading}
          error={isMorpho ? marketError : null}
          assetToken={assetToken}
        />
      </div>
      <div className="min-w-[250px] flex-1">
        <StatsCard
          className="h-full"
          title={t`Management Fee`}
          content={<Text className="mt-2">{managementFee}</Text>}
          isLoading={isMorpho ? marketDataLoading : false}
          error={isMorpho ? marketError : null}
        />
      </div>
      <div className="min-w-[250px] flex-1">
        <StatsCard
          className="h-full"
          title={t`Performance Fee`}
          content={<Text className="mt-2">{performanceFee}</Text>}
          isLoading={isMorpho ? marketDataLoading : false}
          error={isMorpho ? marketError : null}
        />
      </div>
    </div>
  );
}
