import {LoaderCircle, UploadCloud} from 'lucide-react';
import {GlassCard} from '@/src/components/GlassCard';

export function UploadDropzone({
  title,
  hint,
  busy = false,
  statusText,
  onSelect,
}: {
  title: string;
  hint: string;
  busy?: boolean;
  statusText?: string;
  onSelect: (file: File) => void;
}) {
  return (
    <GlassCard className="bg-gradient-to-br from-pastel-peach/50 to-pastel-pink/50">
      <label
        className={`flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-white/80 px-6 py-10 text-center transition ${
          busy ? 'cursor-wait bg-white/25' : 'cursor-pointer hover:bg-white/30'
        }`}
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white/80 text-gray-800">
          {busy ? <LoaderCircle size={24} className="animate-spin" /> : <UploadCloud size={24} />}
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{title}</div>
          <p className="mt-1 text-sm text-gray-600">{busy && statusText ? statusText : hint}</p>
        </div>
        <input
          className="hidden"
          type="file"
          accept="image/*,.heic,.heif"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelect(file);
            event.currentTarget.value = '';
          }}
        />
      </label>
    </GlassCard>
  );
}
