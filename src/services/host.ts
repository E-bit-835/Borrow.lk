import { api } from './api';
import type { Order } from './orders';
import type { PriceUnit } from '../data/categories';
import type { Plan, Payment } from './admin';

export interface HostStats {
  liveListings: number;
  pausedListings: number;
  pendingRequests: number;
  upcoming: number;
  completed: number;
  reviews: number;
}

export interface HostListing {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  subcategory?: string;
  listingType: 'rental' | 'service';
  images: string[];
  pricePerDay: number;
  priceUnit: PriceUnit;
  deposit: number;
  location: string;
  district: string;
  province?: string;
  description: string;
  specifications: Record<string, string>;
  includedItems: string[];
  rentalTerms: string[];
  status: 'published' | 'paused' | 'archived' | 'draft';
  rating: number;
  reviewsCount: number;
  pendingRequests: number;
  createdAt: string;
}

export type ListingInput = Pick<
  HostListing,
  | 'title' | 'subcategory' | 'images' | 'pricePerDay' | 'priceUnit' | 'deposit' | 'location' | 'district' | 'province'
  | 'description' | 'specifications' | 'includedItems' | 'rentalTerms'
>;

export interface HostReview {
  id: string;
  author: string;
  authorAvatar: string | null;
  rating: number;
  comment: string;
  createdAt: string;
  listingId: string;
  listingTitle: string;
}

export interface HostSubscription {
  plans: Plan[];
  /** The plan in force now (the free plan when nothing was bought) */
  plan: Plan | null;
  expiresAt: string | null;
  listingsUsed: number;
  listingLimit: number | null;
  payments: Payment[];
  /** True when paying by card is switched on */
  cardPayments: boolean;
}

/** Host / provider workspace API. The server only ever returns or changes the signed-in account's own data. */
export const hostService = {
  stats: () => api.get<HostStats>('/host/stats'),

  listings: () => api.get<HostListing[]>('/host/listings'),
  listing: (id: string) => api.get<HostListing>(`/host/listings/${id}`),
  createListing: (data: ListingInput & { category: string }) => api.post<{ id: string }>('/products', data),
  updateListing: (id: string, data: Partial<ListingInput> & { status?: 'published' | 'paused' | 'archived' }) =>
    api.patch<HostListing>(`/host/listings/${id}`, data),

  /** Requests customers sent for this account's listings */
  requests: (providerId: string, status?: string) => api.get<Order[]>('/orders', { providerId, status }),
  setRequestStatus: (id: string, status: Order['status']) => api.patch<Order>(`/orders/${id}/status`, { status }),

  blockedDates: (listingId: string) => api.get<string[]>(`/host/listings/${listingId}/blocked-dates`),
  setBlocked: (listingId: string, dates: string[], blocked: boolean) =>
    api.post<string[]>(`/host/listings/${listingId}/blocked-dates`, { dates, blocked }),

  subscription: () => api.get<HostSubscription>('/host/subscription'),
  startCardPayment: (planId: string) => api.post<{ action: string; fields: Record<string, string> }>('/host/subscription/card', { planId }),
  submitPayment: (data: { planId: string; method: string; reference: string }) => api.post<Payment>('/host/subscription/payments', data),

  reviews: () => api.get<HostReview[]>('/host/reviews'),

  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.uploadFile<{ url: string }>('/uploads', form);
    return res.url;
  },
};
