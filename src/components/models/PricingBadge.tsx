import { clsx } from 'clsx';
import { formatPrice } from '../../lib/pricing';

interface PricingBadgeProps {
  price: number;
}

export function PricingBadge({ price }: PricingBadgeProps) {
  if (price === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
        Free
      </span>
    );
  }

  const isCheap = price < 1;
  const isMid = price >= 1 && price < 10;
  
  return (
    <span className={clsx(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono",
      isCheap && "bg-success/10 text-success",
      isMid && "bg-warning/10 text-warning",
      !isCheap && !isMid && "bg-danger/10 text-danger"
    )}>
      {formatPrice(price)}
    </span>
  );
}
