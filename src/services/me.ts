import { api } from './api';
import type { ProductListing } from './products';

export interface MySummary {
  pendingRequests: number;
  upcoming: number;
  completed: number;
  wishlist: number;
  unreadMessages: number;
  unreadNotifications: number;
}

export interface AppNotification {
  id: string;
  type: 'bookings' | 'messages' | 'system' | string;
  title: string;
  description: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  lastMessage: string | null;
  updatedAt: string;
  listingId: string | null;
  listingTitle: string | null;
  otherUser: { id: string; name: string; avatar: string | null };
  unread: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  mine: boolean;
  createdAt: string;
}

/** The signed-in account's own data. The server scopes every call to the current user. */
export const meService = {
  summary: () => api.get<MySummary>('/me/summary'),

  wishlist: () => api.get<ProductListing[]>('/me/wishlist'),
  saveToWishlist: (productId: string) => api.put(`/me/wishlist/${productId}`),
  removeFromWishlist: (productId: string) => api.delete(`/me/wishlist/${productId}`),

  notifications: () => api.get<AppNotification[]>('/me/notifications'),
  markNotificationsRead: (id?: string) => api.post('/me/notifications/read', id ? { id } : {}),

  conversations: () => api.get<Conversation[]>('/me/conversations'),
  messages: (conversationId: string) => api.get<ChatMessage[]>(`/me/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, text: string) =>
    api.post<ChatMessage>(`/me/conversations/${conversationId}/messages`, { text }),
  /** Message the owner of a listing; continues the existing conversation about it if there is one */
  messageOwner: (listingId: string, text: string) =>
    api.post<{ conversationId: string; message: ChatMessage }>('/me/messages', { listingId, text }),

  /** Write to BorrowLK support (an administrator replies in Messages) */
  contactSupport: (text: string) => api.post<{ conversationId: string }>('/me/support', { text }),

  reviewedListingIds: () => api.get<string[]>('/me/reviews'),
  addReview: (data: { orderId: string; rating: number; comment: string }) => api.post<{ id: string }>('/me/reviews', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ changed: boolean }>('/me/password', { currentPassword, newPassword }),
};
