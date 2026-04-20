import type {ReactNode} from 'react';
import {GlassCard} from '@/src/components/GlassCard';

export function ChartCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <GlassCard>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {action}
      </div>
      {children}
    </GlassCard>
  );
}
