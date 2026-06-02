import { Skeleton } from '@/widgets/components/ui/skeleton';
import { Text } from '@/widgets/shared/components/ui/Typography';
import { PopoverRateInfo } from '@/widgets/shared/components/ui/PopoverRateInfo';
import { useSparkVaultRate } from '@/hooks';

/**
 * Spark vault APY, read on-chain from the Vault Savings Rate (`vsr`), shown the same way as the
 * Morpho rate: the value followed by an (i) info icon. Uses the exact same `PopoverRateInfo`
 * component (and icon size/props) as `MorphoRateBreakdownPopover` so the two cards match.
 *
 * TODO: the (i) popover carries a placeholder note. The on-chain VSR reads 0% until Spark activates
 * the vault; confirm with Spark whether to surface the SSR floor / their data-hub rate instead,
 * then replace this `tooltipOverride` with real rate-breakdown copy (ideally a dedicated tooltip id).
 */
export function SparkVaultRate({
  vaultAddress,
  iconClassName
}: {
  vaultAddress?: `0x${string}`;
  iconClassName?: string;
}) {
  const { formattedRate, isLoading } = useSparkVaultRate({ vaultAddress });

  if (isLoading) return <Skeleton className="h-4 w-20" />;
  if (!formattedRate) return null;

  return (
    <div className="flex items-center gap-2">
      <Text variant="large" className="text-text">
        {formattedRate}
      </Text>
      {/* `type` only selects default copy, which we fully override below — the Spark vault rate
          anchors to the Sky Savings Rate, so `ssr` is the closest fallback. */}
      <PopoverRateInfo
        type="ssr"
        iconClassName={iconClassName}
        tooltipOverride={{
          title: 'Vault Savings Rate',
          description:
            'TODO: on-chain Vault Savings Rate (reads 0% until Spark activates the vault) — confirm the final rate source with Spark.'
        }}
      />
    </div>
  );
}
