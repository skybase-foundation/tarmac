/**
 * Spark (spark.fi) provider mark — the official badge.
 * Served from `src/public/images/spark-badge.png` (downscaled to 64px).
 * Rendered as an <img> so sizing/rounding still come from `className`.
 */
export const Spark = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src="/images/spark-badge.png" alt="Spark" width={16} height={16} className={className} {...props} />
);
