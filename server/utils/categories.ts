/** The nine BorrowLK primary categories. Every listing belongs to exactly one. */
export const CATEGORIES = [
  { slug: 'property', name: 'Property', icon: 'Building2' },
  { slug: 'vehicle', name: 'Vehicle', icon: 'Car' },
  { slug: 'electronics', name: 'Electronics', icon: 'Camera' },
  { slug: 'furniture', name: 'Furniture', icon: 'Sofa' },
  { slug: 'computers', name: 'Computers', icon: 'Laptop' },
  { slug: 'fashion', name: 'Fashion', icon: 'Shirt' },
  { slug: 'services', name: 'Services', icon: 'Wrench' },
  { slug: 'books', name: 'Books', icon: 'BookOpen' },
  { slug: 'other', name: 'Other', icon: 'MoreHorizontal' },
] as const;

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name) as [string, ...string[]];

export const PRICE_UNITS = ['hour', 'day', 'night', 'week', 'month', 'service', 'quote'] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

export function categoryByName(name: string) {
  return CATEGORIES.find((c) => c.name.toLowerCase() === name.trim().toLowerCase() || c.slug === name.trim().toLowerCase());
}

/** Services are hired from providers; everything else is rented from hosts. */
export function listingTypeFor(categorySlug: string): 'rental' | 'service' {
  return categorySlug === 'services' ? 'service' : 'rental';
}
