import { cn } from '@/lib/utils';

interface NoShowIndicatorProps {
  probability: number; // 0-1 scale
  className?: string;
}

export default function NoShowIndicator({
  probability,
  className,
}: NoShowIndicatorProps) {
  const pct = Math.round(probability * 100);

  let colorClasses: string;
  let textColor: string;

  if (probability < 0.15) {
    colorClasses = 'bg-green-500';
    textColor = 'text-green-700';
  } else if (probability <= 0.3) {
    colorClasses = 'bg-yellow-500';
    textColor = 'text-yellow-700';
  } else {
    colorClasses = 'bg-red-500';
    textColor = 'text-red-700';
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('inline-block h-2.5 w-2.5 rounded-full', colorClasses)} />
      <span className={cn('text-xs font-medium', textColor)}>{pct}%</span>
    </div>
  );
}
