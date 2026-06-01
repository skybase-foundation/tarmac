import { Trans } from '@lingui/react/macro';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger
} from '@/widgets/components/ui/tooltip';
import { cn } from '@/widgets/lib/utils';
import { Morpho as MorphoIcon } from '@/widgets/shared/components/icons/Morpho';
import { Spark as SparkIcon } from '@/widgets/shared/components/icons/Spark';
import { Text } from '@/widgets/shared/components/ui/Typography';
import { VaultProvider } from '@/hooks';

type VaultPoweredByBadgeProps = {
  /** Which provider the vault is powered by */
  provider: VaultProvider;
  className?: string;
};

/**
 * Provider-aware "Powered by" badge. Renders the provider's icon + tooltip.
 * The Spark variant is added in slice 02 (sUSDT vault registration).
 */
export const VaultPoweredByBadge = ({ provider, className }: VaultPoweredByBadgeProps) => {
  switch (provider) {
    case 'spark':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <SparkIcon className={cn('h-4.5 w-4.5 rounded-sm', className)} />
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent arrowPadding={10} className="max-w-[260px]">
              <Text variant="small">
                <Trans>Vault powered by Spark</Trans>
              </Text>
              <TooltipArrow width={12} height={8} />
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      );
    case 'morpho':
    default:
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <MorphoIcon className={cn('h-4.5 w-4.5 rounded-sm', className)} />
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent arrowPadding={10} className="max-w-[260px]">
              <Text variant="small">
                <Trans>Vault powered by Morpho</Trans>
              </Text>
              <TooltipArrow width={12} height={8} />
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      );
  }
};

/**
 * Morpho-specific badge. Thin alias of {@link VaultPoweredByBadge} so existing
 * call sites keep rendering identically.
 */
export const MorphoVaultBadge = ({ className }: { className?: string }) => (
  <VaultPoweredByBadge provider="morpho" className={className} />
);
