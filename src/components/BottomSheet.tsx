import type {ReactNode} from 'react';
import {cn} from '@/src/lib/utils';

export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto max-w-2xl rounded-t-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl',
        )}
      >
        {children}
      </div>
    </div>
  );
}
