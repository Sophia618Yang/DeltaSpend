import type {ReactNode} from 'react';
import {Sidebar} from '@/src/components/Sidebar';
import {TopBar} from '@/src/components/TopBar';
import {useAuth} from '@/src/app/session';
import {useI18n} from '@/src/lib/i18n';

export function AppShell({children}: {children: ReactNode}) {
  const {isDemo} = useAuth();
  const {messages} = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink/30 via-white/60 to-pastel-blue/30 text-gray-800">
      <div className="fixed left-[-5%] top-[-10%] h-[40vw] w-[40vw] blob-1 bg-pastel-purple opacity-60 blur-[110px]" />
      <div className="fixed bottom-[-10%] right-[-5%] h-[45vw] w-[45vw] blob-2 bg-pastel-mint opacity-60 blur-[120px]" />
      <div className="relative z-10 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 p-3 md:p-6 lg:pl-0">
          <div className="glass-panel min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[2.5rem]">
            <TopBar />
            {isDemo ? (
              <div className="border-b border-white/40 bg-pastel-peach/40 px-5 py-3 text-sm text-gray-700 md:px-8">
                {messages.fallbackNotice}
              </div>
            ) : null}
            <div className="p-5 md:p-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
