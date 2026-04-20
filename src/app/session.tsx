import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';
import type {AppUser} from '@/src/types';
import {getCurrentUser, isDemoMode, signInWithEmail, signOutUser} from '@/src/lib/data';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isDemo: isDemoMode(),
      signIn: async (email: string, displayName: string) => {
        const result = await signInWithEmail(email, displayName);
        if ('user' in result && result.user) {
          setUser(result.user);
          return;
        }
        const refreshed = await getCurrentUser();
        setUser(refreshed);
      },
      signOut: async () => {
        await signOutUser();
        setUser(null);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
