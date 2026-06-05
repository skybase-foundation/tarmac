import { StatsCard } from '@/modules/ui/components/StatsCard';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useMorphoVaultMarketApiData } from '@/hooks';
import { MorphoRateBreakdownPopover } from '@/widgets';

type VaultRateCardProps = {
  vaultAddress: `0x${string}`;
};

export function VaultRateCard({ vaultAddress }: VaultRateCardProps) {
  const { i18n } = useLingui();
  const { isLoading } = useMorphoVaultMarketApiData({ vaultAddress });

  return (
    <StatsCard
      className="h-full"
      isLoading={isLoading}
      title={i18n._(msg`Vault Rate`)}
      content={
        <div className="mt-2 flex items-center gap-1.5">
          <MorphoRateBreakdownPopover vaultAddress={vaultAddress} />
        </div>
      }
    />
  );
}
