import { Icon, IconProps } from './Icon';

/** Spark (spark.fi) provider mark — magenta tile with a spark glyph. */
export const Spark = (props: IconProps) => (
  <Icon {...props} width="16" height="16" viewBox="0 0 200 200" fill="none">
    <rect width="200" height="200" rx="24" fill="#FF2D82" />
    <path d="M104.5 32 64 108h28l-4.5 60 48.5-84h-30l-1.5-52Z" fill="white" />
  </Icon>
);
