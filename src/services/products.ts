import { api } from './api';
import type { PriceUnit } from '../data/categories';

export interface ProductListing {
  id: string;
  /** 'rental' listings are created by hosts, 'service' listings by providers */
  listingType?: 'rental' | 'service';
  subcategory?: string;
  priceUnit?: PriceUnit;
  province?: string;
  title: string;
  category: string;
  categorySlug: string;
  clothingTypeId?: string;
  images: string[];
  pricePerDay: number;
  deposit: number;
  location: string;
  district: string;
  rating: number;
  reviewsCount: number;
  availableNow: boolean;
  isPopular?: boolean;
  isRecent?: boolean;
  featuredBadge?: string;
  description: string;
  specifications: Record<string, string>;
  includedItems: string[];
  rentalTerms: string[];
  provider?: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    reviewsCount: number;
    rentalsCount: number;
    verified: boolean;
    location: string;
  };
  reviews?: Array<{
    id: string;
    authorName: string;
    authorAvatar: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  status: string;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  count: number;
}

export interface ClothingTypeItem {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  gender: string;
  size_chart: string[];
  base_deposit_rate: number;
  inspection_criteria: string[];
  description: string;
}

export const productService = {
  async getAll(params?: {
    category?: string;
    district?: string;
    search?: string;
    clothingTypeId?: string;
    minPrice?: number;
    maxPrice?: number;
    providerId?: string;
    availableOnly?: boolean;
  }): Promise<ProductListing[]> {
    return api.get<ProductListing[]>('/products', params);
  },

  async getById(id: string): Promise<ProductListing> {
    return api.get<ProductListing>(`/products/${id}`);
  },

  /** "Check Availability": is the listing free between these dates? */
  async checkAvailability(id: string, startDate: string, endDate: string): Promise<{ available: boolean; message: string }> {
    return api.get(`/products/${id}/availability`, { startDate, endDate });
  },

  async report(id: string, reason: string): Promise<{ reported: boolean }> {
    return api.post(`/products/${id}/report`, { reason });
  },

  async getCategories(): Promise<CategoryItem[]> {
    return api.get<CategoryItem[]>('/products/categories');
  },

  async getClothingTypes(): Promise<ClothingTypeItem[]> {
    return api.get<ClothingTypeItem[]>('/products/clothing-types');
  },

  async create(data: Partial<ProductListing>): Promise<ProductListing> {
    return api.post<ProductListing>('/products', data);
  },
};
