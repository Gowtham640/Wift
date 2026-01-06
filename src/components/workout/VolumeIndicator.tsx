import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VolumeIndicatorProps {
  percentage: number;
}

export default function VolumeIndicator({ percentage }: VolumeIndicatorProps) {
  if (percentage === 0) {
    return (
      <div className="flex items-center gap-2 text-white/40">
        <Minus size={16} />
        <span className="text-sm">No change</span>
      </div>
    );
  }

  const isPositive = percentage > 0;

  return (
    <div className={`flex items-center gap-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
      {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
      <span className="text-sm font-semibold">
        {isPositive ? '+' : ''}{percentage}%
      </span>
    </div>
  );
}




