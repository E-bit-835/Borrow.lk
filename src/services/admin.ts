import { api } from './api';
import type { UserProfile, PartnerStatus } from './auth';
import type { Order } from './orders';

export interface AdminUser extends UserProfile {
  suspended: boolean;
  listingsCount: number;
}

export interface AdminStats {
  users: number;
  hosts: number;
  providers: number;
  listings: number;
  pendingRequests: number;
  pendingApplications: number;
  openReports: number;
  pendingPayments: number;
  recentUsers: UserProfile[];
  recentRequests: Array<{ orderNumber: string; status: string; createdAt: string; title: string; customer: string | null }>;
}

export type ListingStatus = 'published' | 'paused' | 'archived' | 'draft';

export interface AdminListing {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  listingType: 'rental' | 'service';
  price: number;
  priceUnit: string;
  district: string;
  status: ListingStatus;
  image: string | null;
  createdAt: string;
  ownerId: string | null;
  ownerName: string | null;
}

export interface PartnerApplication {
  user: UserProfile;
  capability: 'HOST' | 'PROVIDER';
  status: PartnerStatus;
  application: Record<string, any>;
}

export interface AdminReport {
  id: string;
  reason: string;
  createdAt: string;
  listingId: string | null;
  listingTitle: string;
  listingStatus: ListingStatus | null;
  reporter: string | null;
  reporterEmail: string | null;
  status: 'open' | 'resolved';
}

export interface AdminReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
  listingId: string | null;
  listingTitle: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  listingLimit: number;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  subscribers?: number;
}
export type PlanInput = Pick<Plan, 'name' | 'description' | 'price' | 'durationDays' | 'listingLimit' | 'isActive'>;

export interface Payment {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  planId: string | null;
  planName: string;
  amount: number;
  method: string;
  reference: string;
  status: 'pending' | 'paid' | 'rejected';
  createdAt: string;
  reviewedAt: string | null;
}

export interface Subscriber {
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  planName: string;
  startedAt: string;
  expiresAt: string;
  active: boolean;
}

export interface AdminConversation {
  id: string;
  lastMessage: string | null;
  updatedAt: string;
  listingId: string | null;
  listingTitle: string | null;
  participants: Array<{ name: string | null; avatar: string | null }>;
  messageCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'hosts' | 'providers' | 'customers';
  recipients: number;
  sentBy: string | null;
  createdAt: string;
}

/** Admin console API. Every call is authorised on the server (admin role required). */
export const adminService = {
  stats: () => api.get<AdminStats>('/admin/stats'),

  users: (params: { search?: string; role?: string }) => api.get<AdminUser[]>('/admin/users', params),
  setSuspended: (id: string, suspended: boolean) => api.patch<AdminUser>(`/admin/users/${id}`, { suspended }),
  setCapability: (id: string, capability: 'HOST' | 'PROVIDER', status: PartnerStatus) =>
    api.patch<UserProfile>(`/admin/users/${id}/capabilities`, { capability, status }),
  createAdmin: (data: { name: string; email: string; password: string }) =>
    api.post<{ user: UserProfile }>('/auth/create-admin', data),

  applications: (status: PartnerStatus) => api.get<PartnerApplication[]>('/admin/applications', { status }),

  listings: (params: { search?: string; status?: string; category?: string }) =>
    api.get<AdminListing[]>('/admin/listings', params),
  setListingStatus: (id: string, status: 'published' | 'paused' | 'archived') =>
    api.patch<{ id: string; status: ListingStatus }>(`/admin/listings/${id}`, { status }),

  requests: (params: { status?: string; search?: string }) => api.get<Order[]>('/orders', params),
  setRequestStatus: (id: string, status: Order['status']) => api.patch<Order>(`/orders/${id}/status`, { status }),

  reports: (status: 'open' | 'resolved') => api.get<AdminReport[]>('/admin/reports', { status }),
  setReportStatus: (id: string, status: 'open' | 'resolved') => api.patch(`/admin/reports/${id}`, { status }),

  plans: () => api.get<Plan[]>('/admin/plans'),
  createPlan: (data: PlanInput) => api.post<Plan>('/admin/plans', data),
  updatePlan: (id: string, data: Partial<PlanInput>) => api.patch<Plan>(`/admin/plans/${id}`, data),
  subscribers: () => api.get<Subscriber[]>('/admin/subscribers'),

  payments: (status: string) => api.get<Payment[]>('/admin/payments', { status }),
  reviewPayment: (id: string, status: 'paid' | 'rejected') => api.patch<Payment>(`/admin/payments/${id}`, { status }),
  /** A payment the admin received directly; the plan starts immediately */
  recordPayment: (data: { userId: string; planId: string; method: string; reference: string }) => api.post<Payment>('/admin/payments', data),
  cancelSubscription: (userId: string) => api.delete(`/admin/subscribers/${userId}`),
  sendDirectMessage: (userId: string, text: string) => api.post<{ conversationId: string }>('/admin/messages', { userId, text }),

  conversations: (search: string) => api.get<AdminConversation[]>('/admin/conversations', { search }),
  conversationMessages: (id: string) =>
    api.get<Array<{ id: string; text: string; sender: string; createdAt: string }>>(`/admin/conversations/${id}/messages`),

  announcements: () => api.get<Announcement[]>('/admin/announcements'),
  sendAnnouncement: (data: { title: string; message: string; audience: Announcement['audience'] }) =>
    api.post<{ recipients: number }>('/admin/announcements', data),

  reviews: () => api.get<AdminReview[]>('/admin/reviews'),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),
};
