import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  authService,
  type UserProfile,
  type AuthResponse,
  type BecomeHostInput,
  type BecomeProviderInput,
} from '../services/auth';

/** Approved HOST capability on this account. */
export function hasHost(profile: UserProfile | null | undefined): boolean {
  return !!profile?.capabilities?.includes('HOST');
}

/** Approved PROVIDER capability on this account. */
export function hasProvider(profile: UserProfile | null | undefined): boolean {
  return !!profile?.capabilities?.includes('PROVIDER');
}

function syncCustomerSession(profile: UserProfile) {
  // Legacy session flags used by the dashboards: "provider" means the account can list (host and/or provider)
  const isPartner = hasHost(profile) || hasProvider(profile);
  const customerUser = {
    id: profile.id,
    name: profile.name,
    firstName: profile.firstName || profile.name.split(' ')[0] || profile.name,
    lastName: profile.lastName || profile.name.split(' ').slice(1).join(' ') || '',
    email: profile.email,
    phone: profile.phone || '',
    dob: profile.dob || '',
    district: profile.district || 'Colombo',
    city: profile.city || 'Colombo',
    address: profile.address || '',
    avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80',
    role: isPartner ? 'provider' : 'customer',
    verificationStatus: profile.verificationStatus || 'unverified',
    emailVerified: Boolean(profile.emailVerified),
    phoneVerified: Boolean(profile.phoneVerified),
    nicVerified: Boolean(profile.nicVerified),
    memberSince: profile.memberSince || '2026',
  };
  sessionStorage.setItem('borrowlk_customer_user', JSON.stringify(customerUser));
  sessionStorage.setItem('borrowlk_is_authenticated', 'true');
  sessionStorage.setItem(
    'borrowlk_user_role',
    isPartner ? 'provider' : 'renter'
  );
  if (isPartner) {
    sessionStorage.setItem('borrowlk_is_provider', 'true');
  } else {
    sessionStorage.removeItem('borrowlk_is_provider');
  }
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Capability flags derived from the server-issued profile (never from client input) */
  isAdmin: boolean;
  isHost: boolean;
  isProvider: boolean;
  becomeHost: (data: BecomeHostInput) => Promise<UserProfile>;
  becomeProvider: (data: BecomeProviderInput) => Promise<UserProfile>;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    district?: string;
    city?: string;
    businessName?: string;
  }) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => authService.getStoredUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('borrowlk_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isAuthenticated = !!token && !!user;

  // On mount, if we have a token, verify it by fetching user profile.
  // This also runs when a cached user exists, so an expired token is not trusted forever.
  useEffect(() => {
    if (!token) return;
    if (!user) setIsLoading(true);
    authService.getMe()
      .then((profile) => {
        setUser(profile);
        if (profile.role !== 'admin') {
          syncCustomerSession(profile);
        }
      })
      .catch((err) => {
        // Only a rejected token ends the session; a network failure keeps it
        if (err?.status === 401 || err?.status === 404) {
          logout();
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await authService.login({ email, password });
      setUser(res.user);
      setToken(res.token);
      syncCustomerSession(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    district?: string;
    city?: string;
    businessName?: string;
  }): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      setUser(res.user);
      setToken(res.token);
      syncCustomerSession(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
    sessionStorage.setItem('borrowlk_is_authenticated', 'false');
    sessionStorage.setItem('borrowlk_user_role', 'guest');
    sessionStorage.removeItem('borrowlk_is_provider');
    sessionStorage.removeItem('borrowlk_provider_profile');
    sessionStorage.removeItem('borrowlk_customer_user');
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await authService.getMe();
      setUser(profile);
      if (profile.role !== 'admin') {
        syncCustomerSession(profile);
      }
    } catch {
      // Keep session; token may recover on next request
    }
  }, [token]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const updated = await authService.updateProfile(updates);
    setUser(updated);
    if (updated.role !== 'admin') {
      syncCustomerSession(updated);
    }
    return updated;
  }, []);

  const becomeHost = useCallback(async (data: BecomeHostInput): Promise<UserProfile> => {
    const updated = await authService.becomeHost(data);
    setUser(updated);
    syncCustomerSession(updated);
    return updated;
  }, []);

  const becomeProvider = useCallback(async (data: BecomeProviderInput): Promise<UserProfile> => {
    const updated = await authService.becomeProvider(data);
    setUser(updated);
    syncCustomerSession(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        isAdmin: isAuthenticated && user?.role === 'admin',
        isHost: isAuthenticated && hasHost(user),
        isProvider: isAuthenticated && hasProvider(user),
        becomeHost,
        becomeProvider,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
