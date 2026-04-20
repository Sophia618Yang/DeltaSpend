import {Globe, Search} from 'lucide-react';
import {useI18n} from '@/src/lib/i18n';

export function TopBar() {
  const {language, setLanguage, messages} = useI18n();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/40 px-5 py-5 md:px-8">
      <div className="relative min-w-[240px] flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          className="w-full rounded-full border border-white/80 bg-white/50 py-2.5 pl-10 pr-4 text-sm outline-none ring-pastel-purple transition focus:ring-2"
          placeholder={messages.searchTransactions}
        />
      </div>
      <button
        className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-medium text-gray-700"
        onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
      >
        <Globe size={16} />
        {language === 'en' ? '中文' : 'EN'}
      </button>
    </header>
  );
}
