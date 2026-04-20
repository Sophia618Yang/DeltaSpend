import type {ReactNode} from 'react';
import {cn} from '@/src/lib/utils';

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('glass-panel rounded-[2rem] p-5 md:p-6', className)}>{children}</div>;
}
