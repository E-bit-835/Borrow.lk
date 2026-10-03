import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000E26] flex items-center justify-center text-white text-xs font-semibold">
        Verifying Admin Credentials...
      </div>
    );
  }

  // Only a signed-in administrator may enter (the API enforces the same rule)
  const isAdminUser = isAuthenticated && user?.role === 'admin';

  if (!isAdminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};
