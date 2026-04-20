import {lazy, Suspense} from 'react';
import {Navigate, Outlet, Route, Routes, useLocation} from 'react-router-dom';
import {AppShell} from '@/src/components/AppShell';
import {EmptyState} from '@/src/components/EmptyState';
import {useAuth} from '@/src/app/session';
import {useI18n} from '@/src/lib/i18n';

const AuthPage = lazy(() =>
  import('@/src/pages/auth/AuthPage').then((module) => ({default: module.AuthPage})),
);
const DashboardPage = lazy(() =>
  import('@/src/pages/dashboard/DashboardPage').then((module) => ({default: module.DashboardPage})),
);
const SubscriptionsPage = lazy(() =>
  import('@/src/pages/subscriptions/SubscriptionsPage').then((module) => ({
    default: module.SubscriptionsPage,
  })),
);

function ProtectedLayout() {
  const {user, loading} = useAuth();
  const location = useLocation();
  const {messages} = useI18n();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <EmptyState title={messages.loading} body="" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{from: location}} />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export function AppRouter() {
  const {user} = useAuth();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center">
          <EmptyState title="Loading" body="" />
        </div>
      }
    >
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/expenses" element={<Navigate to="/dashboard" replace />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/auth'} replace />} />
      </Routes>
    </Suspense>
  );
}
