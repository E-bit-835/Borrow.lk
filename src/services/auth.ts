import { api } from './api';

export type Capability = 'RENTER' | 'HOST' | 'PROVIDER';
export type PartnerStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface BecomeHostInput {
  phone: string;
  district: string;
  city: string;
  businessName?: string;
  nicNumber?: string;
  hostType: 'individual' | 'business';
  categories: string[];
  about?: string;
  acceptTerms: true;
}

export interface BecomeProviderInput {
  phone: string;
  district: string;
  city: string;
  businessName?: string;
  nicNumber?: string;
  serviceCategory: string;
  description: string;
  experience?: string;
  acceptTerms: true;
}

export interface UserProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: 'customer' | 'provider' | 'admin';
  /** One account, many capabilities: RENTER always, HOST / PROVIDER once approved */
  capabilities?: Capability[];
  hostStatus?: PartnerStatus;
  providerStatus?: PartnerStatus;
  district?: string;
  city?: string;
  address?: string;
  businessName?: string;
  avatar?: string;
  dob?: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  emailVerified: boolean;
  phoneVerified: boolean;
  nicVerified: boolean;
  rating?: number;
  reviewsCount?: number;
  rentalsCount?: number;
  memberSince?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    district?: string;
    city?: string;
    businessName?: string;
  }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', data);
    if (res.token) {
      localStorage.setItem('borrowlk_auth_token', res.token);
      localStorage.setItem('borrowlk_user', JSON.stringify(res.user));
    }
    return res;
  },

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', credentials);
    if (res.token) {
      localStorage.setItem('borrowlk_auth_token', res.token);
      localStorage.setItem('borrowlk_user', JSON.stringify(res.user));
    }
    return res;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/forgot-password', { email });
  },

  async resetPassword(data: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/reset-password', data);
  },

  /** Adds the HOST capability to the signed-in account (pending or approved, per platform policy). */
  async becomeHost(data: BecomeHostInput): Promise<UserProfile> {
    const user = await api.post<UserProfile>('/auth/become-host', data);
    localStorage.setItem('borrowlk_user', JSON.stringify(user));
    return user;
  },

  /** Adds the PROVIDER capability to the signed-in account. */
  async becomeProvider(data: BecomeProviderInput): Promise<UserProfile> {
    const user = await api.post<UserProfile>('/auth/become-provider', data);
    localStorage.setItem('borrowlk_user', JSON.stringify(user));
    return user;
  },

  async getMe(): Promise<UserProfile> {
    const user = await api.get<UserProfile>('/auth/me');
    localStorage.setItem('borrowlk_user', JSON.stringify(user));
    return user;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const user = await api.put<UserProfile>('/auth/profile', updates);
    localStorage.setItem('borrowlk_user', JSON.stringify(user));
    return user;
  },

  logout(): void {
    localStorage.removeItem('borrowlk_auth_token');
    localStorage.removeItem('borrowlk_user');
  },

  getStoredUser(): UserProfile | null {
    const stored = localStorage.getItem('borrowlk_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('borrowlk_auth_token');
  },
};
