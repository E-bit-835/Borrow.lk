import type { Listing, Provider, Review } from '../data/marketplaceData';
import type { ProductListing } from '../services/products';

const FALLBACK_PROVIDER: Provider = {
  id: 'unknown',
  name: 'BorrowLK Provider',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80',
  rating: 5,
  reviewsCount: 0,
  rentalsCount: 0,
  verified: false,
  memberSince: '2026',
  responseRate: '—',
  responseTime: '—',
  location: 'Sri Lanka',
};

/** Rental (from a host) or service (from a provider); older records fall back to their category. */
export function listingTypeOf(listing: Pick<Listing, 'listingType' | 'categorySlug'>): 'rental' | 'service' {
  return listing.listingType || (listing.categorySlug === 'services' ? 'service' : 'rental');
}

export function productToListing(product: ProductListing): Listing {
  const provider: Provider = product.provider
    ? {
        id: product.provider.id,
        name: product.provider.name,
        avatar: product.provider.avatar || FALLBACK_PROVIDER.avatar,
        rating: Number(product.provider.rating) || 5,
        reviewsCount: product.provider.reviewsCount || 0,
        rentalsCount: product.provider.rentalsCount || 0,
        verified: Boolean(product.provider.verified),
        memberSince: '2026',
        responseRate: '—',
        responseTime: '—',
        location: product.provider.location || product.location,
      }
    : FALLBACK_PROVIDER;

  const reviews: Review[] = (product.reviews || []).map((r) => ({
    id: r.id,
    authorName: r.authorName,
    authorAvatar: r.authorAvatar,
    rating: r.rating,
    comment: r.comment,
    date: r.date,
  }));

  return {
    id: product.id,
    title: product.title,
    category: product.category,
    categorySlug: product.categorySlug,
    listingType: product.listingType,
    subcategory: product.subcategory,
    priceUnit: product.priceUnit,
    province: product.province,
    images: product.images?.length ? product.images : [FALLBACK_PROVIDER.avatar],
    pricePerDay: Number(product.pricePerDay) || 0,
    location: product.location,
    district: product.district,
    rating: Number(product.rating) || 5,
    reviewsCount: product.reviewsCount || reviews.length,
    availableNow: product.availableNow !== false,
    isPopular: product.isPopular,
    isRecent: product.isRecent,
    featuredBadge: product.featuredBadge,
    provider,
    description: product.description || '',
    specifications: product.specifications || {},
    includedItems: product.includedItems || [],
    rentalTerms: product.rentalTerms || [],
    reviews,
  };
}
