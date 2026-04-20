import {TrendingDown, TrendingUp} from 'lucide-react';
import {GlassCard} from '@/src/components/GlassCard';
import {formatCurrency} from '@/src/lib/utils';

export function MetricCard({
  label,
  amount,
  delta,
}: {
  label: string;
  amount: number;
  delta: number;
}) {
  const positive = delta >= 0;
  return (
    <GlassCard className="bg-white/60">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-3xl font-bold text-gray-900">{formatCurrency(amount)}</div>
        <div
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
            positive ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(delta).toFixed(1)}%
        </div>
      </div>
    </GlassCard>
  );
}
