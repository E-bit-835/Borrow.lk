import { query } from '../config/db';

export interface CreateProductDTO {
  providerId?: string;
  listingType?: 'rental' | 'service';
  subcategory?: string;
  priceUnit?: string;
  province?: string;
  title: string;
  category: string;
  categorySlug?: string;
  clothingTypeId?: string;
  images: string[];
  pricePerDay: number;
  deposit?: number;
  location: string;
  district: string;
  description: string;
  specifications?: Record<string, string>;
  includedItems?: string[];
  rentalTerms?: string[];
  featuredBadge?: string;
}

export class ProductService {
  static async getAll(filters: {
    category?: string;
    district?: string;
    search?: string;
    clothingTypeId?: string;
    minPrice?: number;
    maxPrice?: number;
    providerId?: string;
    listingType?: string;
    subcategory?: string;
    availableOnly?: boolean;
    ids?: string[];
  }) {
    let sql = `
      SELECT p.*, 
             json_build_object(
               'id', u.id,
               'name', COALESCE(u.business_name, u.name),
               'avatar', u.avatar,
               'rating', u.rating,
               'reviewsCount', u.reviews_count,
               'rentalsCount', u.rentals_count,
               'verified', (u.verification_status = 'verified'),
               'location', COALESCE(u.city || ', ' || u.district, u.address, 'Sri Lanka')
             ) AS provider
      FROM products p
      LEFT JOIN users u ON p.provider_id = u.id
      WHERE p.status = 'published'
    `;
    const params: any[] = [];
    let idx = 1;

    if (filters.category && filters.category !== 'all') {
      sql += ` AND (p.category_slug = $${idx} OR p.category ILIKE $${idx})`;
      params.push(filters.category);
      idx++;
    }

    if (filters.clothingTypeId) {
      sql += ` AND p.clothing_type_id = $${idx}`;
      params.push(filters.clothingTypeId);
      idx++;
    }

    if (filters.district) {
      sql += ` AND p.district ILIKE $${idx}`;
      params.push(`%${filters.district}%`);
      idx++;
    }

    if (filters.providerId) {
      sql += ` AND p.provider_id = $${idx}`;
      params.push(filters.providerId);
      idx++;
    }

    if (filters.listingType === 'rental' || filters.listingType === 'service') {
      sql += ` AND p.listing_type = $${idx}`;
      params.push(filters.listingType);
      idx++;
    }

    if (filters.subcategory) {
      sql += ` AND p.subcategory ILIKE $${idx}`;
      params.push(filters.subcategory);
      idx++;
    }

    if (filters.ids) {
      sql += ` AND p.id = ANY($${idx})`;
      params.push(filters.ids);
      idx++;
    }

    if (filters.availableOnly) {
      sql += ` AND p.available_now = TRUE`;
    }

    if (filters.minPrice !== undefined) {
      sql += ` AND p.price_per_day >= $${idx}`;
      params.push(filters.minPrice);
      idx++;
    }

    if (filters.maxPrice !== undefined) {
      sql += ` AND p.price_per_day <= $${idx}`;
      params.push(filters.maxPrice);
      idx++;
    }

    if (filters.search) {
      sql += ` AND (p.title ILIKE $${idx} OR p.description ILIKE $${idx} OR p.location ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    sql += ` ORDER BY p.created_at DESC`;

    const res = await query(sql, params);
    return res.rows.map(this.formatProduct);
  }

  static async getById(id: string) {
    const res = await query(
      `SELECT p.*,
              json_build_object(
                'id', u.id,
                'name', COALESCE(u.business_name, u.name),
                'avatar', u.avatar,
                'rating', u.rating,
                'reviewsCount', u.reviews_count,
                'rentalsCount', u.rentals_count,
                'verified', (u.verification_status = 'verified'),
                'location', COALESCE(u.city || ', ' || u.district, u.address, 'Sri Lanka')
              ) AS provider
       FROM products p
       LEFT JOIN users u ON p.provider_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      const error: any = new Error('Product listing not found.');
      error.code = 'PRODUCT_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    const reviewsRes = await query(
      `SELECT id, author_name AS "authorName", author_avatar AS "authorAvatar", rating, comment, to_char(created_at, 'Month YYYY') AS date
       FROM reviews WHERE product_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    return { ...this.formatProduct(res.rows[0]), reviews: reviewsRes.rows };
  }

  static async create(data: CreateProductDTO) {
    const res = await query(
      `INSERT INTO products (provider_id, title, category, category_slug, clothing_type_id, images, price_per_day, deposit, location, district, description, specifications, included_items, rental_terms, featured_badge, listing_type, subcategory, price_unit, province)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        data.providerId || null,
        data.title,
        data.category,
        data.categorySlug || data.category.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        data.clothingTypeId || null,
        JSON.stringify(data.images || []),
        data.pricePerDay,
        data.deposit ?? (data.listingType === 'service' ? 0 : data.pricePerDay * 1.5),
        data.location,
        data.district,
        data.description,
        JSON.stringify(data.specifications || {}),
        JSON.stringify(data.includedItems || []),
        JSON.stringify(data.rentalTerms || []),
        data.featuredBadge || null,
        data.listingType || 'rental',
        data.subcategory || null,
        data.priceUnit || 'day',
        data.province || null,
      ]
    );

    return this.formatProduct(res.rows[0]);
  }

  /** A listing is unavailable when paused or when an accepted request already covers the dates. */
  static async checkAvailability(id: string, startDate: string, endDate: string, ignoreOrderId?: string) {
    const res = await query(`SELECT listing_type, status, available_now FROM products WHERE id = $1`, [id]);
    if (res.rows.length === 0 || res.rows[0].status !== 'published') {
      const error: any = new Error('Listing not found.');
      error.code = 'PRODUCT_NOT_FOUND';
      error.status = 404;
      throw error;
    }
    if (Number.isNaN(Date.parse(startDate)) || Number.isNaN(Date.parse(endDate)) || Date.parse(endDate) < Date.parse(startDate)) {
      const error: any = new Error('Choose a valid start and end date.');
      error.code = 'INVALID_DATES';
      error.status = 400;
      throw error;
    }

    const isService = res.rows[0].listing_type === 'service';
    const clash = await query(
      `SELECT 1 FROM orders WHERE product_id = $1 AND status IN ('confirmed', 'active')
          AND start_date <= $3::date AND end_date >= $2::date AND id <> $4 LIMIT 1`,
      [id, startDate, endDate, ignoreOrderId || '']
    );
    const blocked = await query(
      `SELECT 1 FROM listing_blocked_dates WHERE product_id = $1 AND blocked_date BETWEEN $2::date AND $3::date LIMIT 1`,
      [id, startDate, endDate]
    );
    const available = res.rows[0].available_now !== false && clash.rows.length === 0 && blocked.rows.length === 0;
    return {
      available,
      message: available
        ? 'Available for the selected dates.'
        : isService
        ? 'This provider is not available for the selected date.'
        : 'This listing is currently unavailable for the selected dates.',
    };
  }

  static async getCategories() {
    const res = await query(`SELECT * FROM categories ORDER BY count DESC`);
    return res.rows;
  }

  static async getClothingTypes() {
    const res = await query(`SELECT * FROM clothing_types ORDER BY name ASC`);
    return res.rows;
  }

  private static formatProduct(row: any) {
    return {
      id: row.id,
      listingType: row.listing_type || 'rental',
      subcategory: row.subcategory || undefined,
      priceUnit: row.price_unit || 'day',
      province: row.province || undefined,
      title: row.title,
      category: row.category,
      categorySlug: row.category_slug,
      clothingTypeId: row.clothing_type_id,
      images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
      pricePerDay: parseFloat(row.price_per_day),
      deposit: parseFloat(row.deposit || '0'),
      location: row.location,
      district: row.district,
      rating: parseFloat(row.rating || '5.0'),
      reviewsCount: parseInt(row.reviews_count || '0', 10),
      availableNow: row.available_now,
      isPopular: row.is_popular,
      isRecent: row.is_recent,
      featuredBadge: row.featured_badge,
      description: row.description,
      specifications: typeof row.specifications === 'string' ? JSON.parse(row.specifications) : (row.specifications || {}),
      includedItems: typeof row.included_items === 'string' ? JSON.parse(row.included_items) : (row.included_items || []),
      rentalTerms: typeof row.rental_terms === 'string' ? JSON.parse(row.rental_terms) : (row.rental_terms || []),
      provider: row.provider,
      status: row.status,
      createdAt: row.created_at,
    };
  }
}
