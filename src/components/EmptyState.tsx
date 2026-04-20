import {GlassCard} from '@/src/components/GlassCard';

export function EmptyState({title, body}: {title: string; body: string}) {
  return (
    <GlassCard className="border border-dashed border-white/70 text-center">
      <div className="mx-auto max-w-md space-y-2 py-10">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{body}</p>
      </div>
    </GlassCard>
  );
}
