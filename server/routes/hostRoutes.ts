import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireCapability } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { query } from '../config/db';
import { PRICE_UNITS } from '../utils/categories';
import { SubscriptionService } from '../services/subscriptionService';

/**
 * Host / provider workspace API. Everything here acts on the signed-in account's own listings
 * and requires an approved HOST or PROVIDER capability.
 */
const router = Router();
router.use(requireAuth, requireCapability('HOST', 'PROVIDER'));

type Handler = (req: AuthRequest, res: Response) => Promise<unknown>;
const handle = (fn: Handler) => async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await fn(req, res) });
  } catch (error) {
    next(error);
  }
};
const httpError = (message: string, code: string, status: number) => {
  const error: any = new Error(message);
  error.code = code;
  error.status = status;
  return error;
};
const parse = (v: any, fallback: any) => (typeof v === 'string' ? JSON.parse(v) : v ?? fallback);

const formatListing = (r: any) => ({
  id: r.id,
  title: r.title,
  category: r.category,
  categorySlug: r.category_slug,
  subcategory: r.subcategory || undefined,
  listingType: r.listing_type || 'rental',
  images: parse(r.images, []),
  pricePerDay: parseFloat(r.price_per_day),
  priceUnit: r.price_unit || 'day',
  deposit: parseFloat(r.deposit || '0'),
  location: r.location,
  district: r.district,
  province: r.province || undefined,
  description: r.description,
  specifications: parse(r.specifications, {}),
  includedItems: parse(r.included_items, []),
  rentalTerms: parse(r.rental_terms, []),
  status: r.status,
  rating: parseFloat(r.rating || '5'),
  reviewsCount: parseInt(r.reviews_count || '0', 10),
  pendingRequests: r.pending_requests ?? 0,
  createdAt: r.created_at,
});

/** Loads a listing and makes sure it belongs to the signed-in account. */
async function ownListing(id: string, userId: string) {
  const res = await query(`SELECT * FROM products WHERE id = $1`, [id]);
  // Same response for a missing listing and someone else's, so IDs cannot be probed
  if (res.rows.length === 0 || res.rows[0].provider_id !== userId) {
    throw httpError('Listing not found.', 'PRODUCT_NOT_FOUND', 404);
  }
  return res.rows[0];
}

// ---------- Overview
router.get(
  '/stats',
  handle(async (req) => {
    const me = req.user!.id;
    const res = await query(
      `SELECT
         (SELECT count(*)::int FROM products WHERE provider_id = $1 AND status = 'published') AS live_listings,
         (SELECT count(*)::int FROM products WHERE provider_id = $1 AND status = 'paused') AS paused_listings,
         (SELECT count(*)::int FROM orders WHERE provider_id = $1 AND status = 'pending') AS pending_requests,
         (SELECT count(*)::int FROM orders WHERE provider_id = $1 AND status IN ('confirmed', 'active') AND end_date >= CURRENT_DATE) AS upcoming,
         (SELECT count(*)::int FROM orders WHERE provider_id = $1 AND status = 'completed') AS completed,
         (SELECT count(*)::int FROM reviews r JOIN products p ON p.id = r.product_id WHERE p.provider_id = $1) AS reviews`,
      [me]
    );
    const r = res.rows[0];
    return {
      liveListings: r.live_listings, pausedListings: r.paused_listings, pendingRequests: r.pending_requests,
      upcoming: r.upcoming, completed: r.completed, reviews: r.reviews,
    };
  })
);

// ---------- My listings (every status, unlike the public catalogue)
router.get(
  '/listings',
  handle(async (req) => {
    const res = await query(
      `SELECT p.*, (SELECT count(*)::int FROM orders o WHERE o.product_id = p.id AND o.status = 'pending') AS pending_requests
         FROM products p WHERE p.provider_id = $1 AND p.status <> 'archived' ORDER BY p.created_at DESC`,
      [req.user!.id]
    );
    return res.rows.map(formatListing);
  })
);

router.get(
  '/listings/:id',
  handle(async (req) => formatListing(await ownListing(String(req.params.id), req.user!.id)))
);

// The category (and so the rental / service type) is fixed once a listing exists
const updateListingSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  subcategory: z.string().trim().max(100).optional(),
  images: z.array(z.string()).max(10).optional(),
  pricePerDay: z.coerce.number().positive().optional(),
  priceUnit: z.enum(PRICE_UNITS).optional(),
  deposit: z.coerce.number().min(0).optional(),
  location: z.string().trim().min(1).max(255).optional(),
  district: z.string().trim().min(1).max(100).optional(),
  province: z.string().trim().max(100).optional(),
  description: z.string().optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  includedItems: z.array(z.string()).optional(),
  rentalTerms: z.array(z.string()).optional(),
  // A host can pause, re-publish or remove (archive) a listing
  status: z.enum(['published', 'paused', 'archived']).optional(),
});

const COLUMNS: Record<string, { column: string; json?: boolean }> = {
  title: { column: 'title' },
  subcategory: { column: 'subcategory' },
  images: { column: 'images', json: true },
  pricePerDay: { column: 'price_per_day' },
  priceUnit: { column: 'price_unit' },
  deposit: { column: 'deposit' },
  location: { column: 'location' },
  district: { column: 'district' },
  province: { column: 'province' },
  description: { column: 'description' },
  specifications: { column: 'specifications', json: true },
  includedItems: { column: 'included_items', json: true },
  rentalTerms: { column: 'rental_terms', json: true },
  status: { column: 'status' },
};

router.patch(
  '/listings/:id',
  validate(updateListingSchema),
  handle(async (req) => {
    const id = String(req.params.id);
    await ownListing(id, req.user!.id);

    const sets: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(req.body)) {
      const def = COLUMNS[key];
      if (!def || value === undefined) continue;
      values.push(def.json ? JSON.stringify(value) : value);
      sets.push(`${def.column} = $${values.length}`);
    }
    if (sets.length > 0) {
      values.push(id);
      await query(`UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`, values);
    }
    return formatListing(await ownListing(id, req.user!.id));
  })
);

// ---------- Blocked dates (days the host has marked as unavailable)
router.get(
  '/listings/:id/blocked-dates',
  handle(async (req) => {
    const id = String(req.params.id);
    await ownListing(id, req.user!.id);
    const res = await query(
      `SELECT to_char(blocked_date, 'YYYY-MM-DD') AS d FROM listing_blocked_dates WHERE product_id = $1 AND blocked_date >= CURRENT_DATE - 31 ORDER BY 1`,
      [id]
    );
    return res.rows.map((r) => r.d);
  })
);

const blockSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must be YYYY-MM-DD')).min(1).max(366),
  blocked: z.boolean(),
});

router.post(
  '/listings/:id/blocked-dates',
  validate(blockSchema),
  handle(async (req) => {
    const id = String(req.params.id);
    await ownListing(id, req.user!.id);
    const { dates, blocked } = req.body as z.infer<typeof blockSchema>;
    if (blocked) {
      await query(
        `INSERT INTO listing_blocked_dates (product_id, blocked_date) SELECT $1, unnest($2::date[]) ON CONFLICT DO NOTHING`,
        [id, dates]
      );
    } else {
      await query(`DELETE FROM listing_blocked_dates WHERE product_id = $1 AND blocked_date = ANY($2::date[])`, [id, dates]);
    }
    const res = await query(
      `SELECT to_char(blocked_date, 'YYYY-MM-DD') AS d FROM listing_blocked_dates WHERE product_id = $1 AND blocked_date >= CURRENT_DATE - 31 ORDER BY 1`,
      [id]
    );
    return res.rows.map((r) => r.d);
  })
);

// ---------- Subscription: plans, my current plan and my payments
router.get(
  '/subscription',
  handle(async (req) => {
    const [plans, entitlement, payments] = await Promise.all([
      SubscriptionService.listPlans(false),
      SubscriptionService.entitlement(req.user!.id),
      SubscriptionService.listPayments({ userId: req.user!.id }),
    ]);
    return { plans, ...entitlement, payments, cardPayments: SubscriptionService.cardPaymentsEnabled() };
  })
);

router.post(
  '/subscription/payments',
  validate(
    z.object({
      planId: z.string().min(1),
      method: z.enum(['bank_transfer', 'cash_deposit', 'online_transfer']),
      reference: z.string().trim().min(3, 'Enter the payment reference').max(255),
    })
  ),
  handle((req) => SubscriptionService.submitPayment(req.user!.id, req.body))
);

// Pay for a plan by card: returns the PayHere checkout form for the browser to submit
router.post(
  '/subscription/card',
  validate(z.object({ planId: z.string().min(1) })),
  handle((req) => SubscriptionService.startCardPayment(req.user!.id, req.body.planId, String(req.headers.origin || '')))
);

// ---------- Reviews on my listings
router.get(
  '/reviews',
  handle(async (req) => {
    const res = await query(
      `SELECT r.id, r.author_name, r.author_avatar, r.rating, r.comment, r.created_at, p.id AS product_id, p.title
         FROM reviews r JOIN products p ON p.id = r.product_id
        WHERE p.provider_id = $1 ORDER BY r.created_at DESC LIMIT 200`,
      [req.user!.id]
    );
    return res.rows.map((r) => ({
      id: r.id, author: r.author_name, authorAvatar: r.author_avatar, rating: r.rating, comment: r.comment,
      createdAt: r.created_at, listingId: r.product_id, listingTitle: r.title,
    }));
  })
);

export default router;
