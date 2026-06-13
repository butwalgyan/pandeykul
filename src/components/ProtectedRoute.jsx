import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AccessDenied = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <p className="text-4xl mb-3">🔒</p>
      <h2 className="font-heading text-xl font-semibold mb-1">Access Denied</h2>
      <p className="text-muted-foreground text-sm">This page is for admins only.</p>
    </div>
  </div>
);

export default function ProtectedRoute({
  fallback = <DefaultFallback />,
  unauthenticatedElement,
  adminOnly = false,
}) {
  const {
    isAuthenticated,
    isLoadingAuth,
    authChecked,
    authError,
    checkUserAuth,
    user,
    navigateToLogin,
  } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }

    if (unauthenticatedElement) {
      return unauthenticatedElement;
    }

    navigateToLogin();
    return fallback;
  }

  if (!isAuthenticated) {
    if (unauthenticatedElement) {
      return unauthenticatedElement;
    }

    navigateToLogin();
    return fallback;
  }

  if (adminOnly && user?.user_metadata?.role !== 'admin') {
    return <AccessDenied />;
  }

  return <Outlet />;
}