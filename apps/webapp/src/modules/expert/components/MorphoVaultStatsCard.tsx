import { formatBigInt } from '@/utils';
import {
  Token,
  getTokenDecimals,
  useVaultMarketData,
  useErc4626VaultData,
  type VaultProvider
} from '@/hooks';
import { Text } from '@/modules/layout/components/Typography';
import { VStack } from '@/modules/layout/components/VStack';
import { HStack } from '@/modules/layout/components/HStack';
import { TokenIcon } from '@/modules/ui/components/TokenIcon';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useChainId } from 'wagmi';
import { MorphoRateBreakdownPopover, VaultPoweredByBadge } from '@/widgets';
import { Trans } from '@lingui/react/macro';

type MorphoVaultStatsCardProps = {
  vaultAddress: Record<number, `0x${string}`>;
  vaultName: string;
  assetToken: Token;
  /** Which provider operates the vault (branding + data source). Defaults to Morpho. */
  provider?: VaultProvider;
  onClick?: () => void;
  disabled?: boolean;
};

export const MorphoVaultStatsCard = ({
  vaultAddress,
  vaultName,
  assetToken,
  provider = 'morpho',
  onClick,
  disabled = false
}: MorphoVaultStatsCardProps) => {
  const chainId = useChainId();
  const assetDecimals = getTokenDecimals(assetToken, chainId);

  const currentVaultAddress = vaultAddress[chainId];

  const { data: marketData, isLoading: marketDataLoading } = useVaultMarketData({
    provider,
    vaultAddress: currentVaultAddress
  });

  // On-chain TVL fallback for providers without a market-data source yet (Spark).
  // Disabled for Morpho (it reads TVL from its API) so Morpho cards add no RPC calls.
  const { data: onChainData, isLoading: onChainLoading } = useErc4626VaultData({
    vaultAddress: provider === 'morpho' ? undefined : currentVaultAddress,
    provider
  });

  const totalAssets = marketData?.totalAssets ?? onChainData?.totalAssets;
  const tvlLoading = marketDataLoading || (marketData?.totalAssets === undefined && onChainLoading);

  if (!currentVaultAddress) {
    return null;
  }

  return (
    <Card
      className={`from-card to-card h-full bg-transparent bg-radial-(--gradient-position) transition-[background-color,background-image,opacity] lg:p-5 ${onClick && !disabled ? 'hover:from-primary-start/100 hover:to-primary-end/100 cursor-pointer' : ''} ${disabled ? 'opacity-50' : ''}`}
      onClick={disabled ? undefined : onClick}
      data-testid={`${provider}-vault-stats-card`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        {/* Left side - Title */}
        <HStack className="items-center" gap={2}>
          <TokenIcon className="h-6 w-6" token={{ symbol: assetToken.symbol }} />
          <Text>{vaultName}</Text>
          <VaultPoweredByBadge provider={provider} />
        </HStack>

        {/* Right side - Rate (Morpho-API sourced; only shown for Morpho vaults) */}
        {provider === 'morpho' && (
          <MorphoRateBreakdownPopover vaultAddress={currentVaultAddress} tooltipIconClassName="w-3 h-3" />
        )}
      </CardHeader>

      <CardContent className="mt-5 p-0">
        <HStack className="justify-between" gap={2}>
          {/* Liquidity */}
          <VStack className="items-stretch justify-between" gap={2} data-testid="liquidity-container">
            <Text className="text-textSecondary text-sm leading-4">
              <Trans>Liquidity</Trans>
            </Text>
            {marketDataLoading ? (
              <Skeleton className="h-4 w-21" />
            ) : marketData?.liquidity !== undefined ? (
              <Text dataTestId="morpho-vault-tvl">
                {formatBigInt(marketData.liquidity, { unit: assetDecimals, compact: true })}{' '}
                {assetToken.symbol}
              </Text>
            ) : (
              <Text dataTestId="morpho-vault-tvl">—</Text>
            )}
          </VStack>
          {/* TVL */}
          <VStack className="items-stretch justify-between text-right" gap={2} data-testid="tvl-container">
            <Text className="text-textSecondary text-sm leading-4">
              <Trans>TVL</Trans>
            </Text>
            {tvlLoading ? (
              <div className="flex justify-end">
                <Skeleton className="h-4 w-30" />
              </div>
            ) : totalAssets !== undefined ? (
              <Text dataTestId="morpho-vault-tvl">
                {formatBigInt(totalAssets, { unit: assetDecimals, compact: true })} {assetToken.symbol}
              </Text>
            ) : (
              <Text dataTestId="morpho-vault-tvl">—</Text>
            )}
          </VStack>
        </HStack>
      </CardContent>
    </Card>
  );
};
