import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Checking: React.FC = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 text-xs font-semibold">
    Checking your session...
  </div>
);

/** Any signed-in account. Guests are sent to login and returned here afterwards. */
export const RequireAuth: React.FC<{ children: React.ReactNode; message?: string }> = ({ children, message }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Checking />;
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search, message: message || 'Please log in or create an account to continue.' }}
      />
    );
  }
  return <>{children}</>;
};

/**
 * Host / provider workspace. Needs an approved HOST and/or PROVIDER capability on the account;
 * renters are sent to the matching "Become a ..." flow instead of seeing an error.
 * This only shapes the UI: the API enforces the same rule on every request.
 */
export const RequireCapability: React.FC<{
  children: React.ReactNode;
  anyOf: Array<'HOST' | 'PROVIDER'>;
}> = ({ children, anyOf }) => {
  const { isAuthenticated, isLoading, isAdmin, isHost, isProvider } = useAuth();
  const location = useLocation();

  if (isLoading) return <Checking />;
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search, message: 'Please log in or create an account to continue.' }}
      />
    );
  }
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const allowed = (anyOf.includes('HOST') && isHost) || (anyOf.includes('PROVIDER') && isProvider);
  if (!allowed) {
    return <Navigate to={anyOf.includes('HOST') ? '/become-host' : '/become-provider'} replace />;
  }
  return <>{children}</>;
};
