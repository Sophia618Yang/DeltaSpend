import {CreditCard, LayoutDashboard, LogOut} from 'lucide-react';
import {NavLink} from 'react-router-dom';
import {useAuth} from '@/src/app/session';
import {useI18n} from '@/src/lib/i18n';
import {cn} from '@/src/lib/utils';

const navItems = [
  {to: '/dashboard', icon: LayoutDashboard, key: 'dashboard'},
  {to: '/subscriptions', icon: CreditCard, key: 'subscriptions'},
] as const;

export function Sidebar() {
  const {messages} = useI18n();
  const {user, signOut} = useAuth();

  return (
    <aside className="relative z-10 w-full max-w-[280px] p-5 md:p-6">
      <div className="glass-panel flex h-full min-h-[calc(100vh-3rem)] flex-col rounded-[2.5rem] p-5">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-900 text-white blob-4">
            △
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{messages.appName}</div>
            <div className="text-xs text-gray-500">{messages.readyForLaunch}</div>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({isActive}) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'glass-panel bg-white/70 text-gray-900'
                      : 'text-gray-600 hover:bg-white/35 hover:text-gray-900',
                  )
                }
              >
                <Icon size={18} />
                {messages[item.key]}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="glass-panel rounded-[1.75rem] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-500">{messages.signedInAs}</div>
            <div className="mt-2 font-semibold text-gray-900">{user?.displayName}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
          </div>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white"
            onClick={() => void signOut()}
          >
            <LogOut size={16} />
            {messages.signOut}
          </button>
        </div>
      </div>
    </aside>
  );
}
