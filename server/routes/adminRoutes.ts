import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { query } from '../config/db';
import { CapabilityService } from '../services/capabilityService';
import { formatUser } from '../utils/formatUser';
import { PARTNER_STATUSES, type PartnerStatus } from '../utils/capabilities';
import { SubscriptionService } from '../services/subscriptionService';
import { notify } from '../utils/notify';

const router = Router();

// Everything under /api/admin requires an administrator session
router.use(requireAuth, requireRole('admin'));

type Handler = (req: AuthRequest, res: Response) => Promise<unknown>;
/** Wraps a handler so thrown errors reach the global error handler and results use the standard envelope. */
const handle = (fn: Handler) => async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await fn(req, res) });
  } catch (error) {
    next(error);
  }
};
const notFound = (what: string) => {
  const error: any = new Error(`${what} not found.`);
  error.code = 'NOT_FOUND';
  error.status = 404;
  return error;
};
const count = async (sql: string) => (await query(sql)).rows[0].n as number;

// ---------- Overview
router.get(
  '/stats',
  handle(async () => {
    const [users, hosts, providers, listings, pendingRequests, pendingApplications, openReports, pendingPayments] = await Promise.all([
      count(`SELECT count(*)::int n FROM users WHERE role <> 'admin'`),
      count(`SELECT count(*)::int n FROM users WHERE host_status = 'approved' OR role = 'provider'`),
      count(`SELECT count(*)::int n FROM users WHERE provider_status = 'approved'`),
      count(`SELECT count(*)::int n FROM products WHERE status = 'published'`),
      count(`SELECT count(*)::int n FROM orders WHERE status = 'pending'`),
      count(`SELECT count(*)::int n FROM users WHERE host_status = 'pending' OR provider_status = 'pending'`),
      count(`SELECT count(*)::int n FROM activity_logs WHERE action = 'report_listing' AND COALESCE(details->>'status', 'open') = 'open'`),
      count(`SELECT count(*)::int n FROM subscription_payments WHERE status = 'pending' AND method <> 'card'`),
    ]);
    const recentUsers = await query(`SELECT * FROM users WHERE role <> 'admin' ORDER BY created_at DESC LIMIT 5`);
    const recentRequests = await query(
      `SELECT o.order_number, o.status, o.created_at, p.title, u.name AS customer
         FROM orders o JOIN products p ON p.id = o.product_id LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC LIMIT 5`
    );
    return {
      users, hosts, providers, listings, pendingRequests, pendingApplications, openReports, pendingPayments,
      recentUsers: recentUsers.rows.map(formatUser),
      recentRequests: recentRequests.rows.map((r) => ({
        orderNumber: r.order_number, status: r.status, createdAt: r.created_at, title: r.title, customer: r.customer,
      })),
    };
  })
);

// ---------- Users
router.get(
  '/users',
  handle(async (req) => {
    const search = String(req.query.search || '').trim();
    const role = String(req.query.role || 'all');
    const params: any[] = [];
    let where = 'WHERE 1=1';
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
    }
    if (role === 'admin') where += ` AND u.role = 'admin'`;
    else if (role === 'host') where += ` AND u.role <> 'admin' AND (u.host_status = 'approved' OR u.role = 'provider')`;
    else if (role === 'provider') where += ` AND u.provider_status = 'approved'`;
    else if (role === 'renter') where += ` AND u.role <> 'admin'`;
    else if (role === 'suspended') where += ` AND u.is_suspended = TRUE`;

    const res = await query(
      `SELECT u.*, (SELECT count(*)::int FROM products p WHERE p.provider_id = u.id) AS listings_count
         FROM users u ${where} ORDER BY u.created_at DESC LIMIT 300`,
      params
    );
    return res.rows.map((row) => ({ ...formatUser(row), listingsCount: row.listings_count }));
  })
);

router.patch(
  '/users/:id',
  validate(z.object({ suspended: z.boolean() })),
  handle(async (req) => {
    if (req.params.id === req.user!.id) {
      const error: any = new Error('You cannot suspend your own account.');
      error.code = 'FORBIDDEN';
      error.status = 400;
      throw error;
    }
    const res = await query(`UPDATE users SET is_suspended = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [
      req.body.suspended,
      String(req.params.id),
    ]);
    if (res.rows.length === 0) throw notFound('User');
    return formatUser(res.rows[0]);
  })
);

// Approve, reject or revoke a user's HOST / PROVIDER capability
router.patch(
  '/users/:id/capabilities',
  validate(z.object({ capability: z.enum(['HOST', 'PROVIDER']), status: z.enum(['none', 'pending', 'approved', 'rejected']) })),
  handle((req) => CapabilityService.setStatus(String(req.params.id), req.body.capability, req.body.status))
);

// ---------- Host / provider applications
router.get(
  '/applications',
  handle((req) => {
    const requested = String(req.query.status || 'pending') as PartnerStatus;
    const status = PARTNER_STATUSES.includes(requested) && requested !== 'none' ? requested : 'pending';
    return CapabilityService.listApplications(status);
  })
);

// ---------- Listings (all statuses, unlike the public catalogue)
router.get(
  '/listings',
  handle(async (req) => {
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || 'all');
    const category = String(req.query.category || 'all');
    const params: any[] = [];
    let where = 'WHERE 1=1';
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (p.title ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
    }
    if (status !== 'all') {
      params.push(status);
      where += ` AND p.status = $${params.length}`;
    }
    if (category !== 'all') {
      params.push(category);
      where += ` AND p.category_slug = $${params.length}`;
    }
    const res = await query(
      `SELECT p.id, p.title, p.category, p.subcategory, p.listing_type, p.price_per_day, p.price_unit, p.district,
              p.status, p.images, p.created_at, u.id AS owner_id, COALESCE(u.business_name, u.name) AS owner_name
         FROM products p LEFT JOIN users u ON u.id = p.provider_id ${where}
        ORDER BY p.created_at DESC LIMIT 300`,
      params
    );
    return res.rows.map((r) => ({
      id: r.id, title: r.title, category: r.category, subcategory: r.subcategory, listingType: r.listing_type,
      price: parseFloat(r.price_per_day), priceUnit: r.price_unit, district: r.district, status: r.status,
      image: (typeof r.images === 'string' ? JSON.parse(r.images) : r.images || [])[0] || null,
      createdAt: r.created_at, ownerId: r.owner_id, ownerName: r.owner_name,
    }));
  })
);

router.patch(
  '/listings/:id',
  validate(z.object({ status: z.enum(['published', 'paused', 'archived']) })),
  handle(async (req) => {
    const res = await query(`UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status`, [
      req.body.status,
      String(req.params.id),
    ]);
    if (res.rows.length === 0) throw notFound('Listing');
    return res.rows[0];
  })
);

// ---------- Reported listings
router.get(
  '/reports',
  handle(async (req) => {
    const status = req.query.status === 'resolved' ? 'resolved' : 'open';
    const res = await query(
      `SELECT a.id, a.details, a.created_at, a.entity_id, u.name AS reporter, u.email AS reporter_email,
              p.title, p.status AS listing_status
         FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id LEFT JOIN products p ON p.id = a.entity_id
        WHERE a.action = 'report_listing' AND COALESCE(a.details->>'status', 'open') = $1
        ORDER BY a.created_at DESC LIMIT 200`,
      [status]
    );
    return res.rows.map((r) => ({
      id: r.id, reason: r.details?.reason || '', createdAt: r.created_at, listingId: r.entity_id,
      listingTitle: r.title || r.details?.title || 'Deleted listing', listingStatus: r.listing_status,
      reporter: r.reporter, reporterEmail: r.reporter_email, status,
    }));
  })
);

router.patch(
  '/reports/:id',
  validate(z.object({ status: z.enum(['open', 'resolved']) })),
  handle(async (req) => {
    const res = await query(
      `UPDATE activity_logs SET details = COALESCE(details, '{}'::jsonb) || $1::jsonb
        WHERE id = $2 AND action = 'report_listing' RETURNING id`,
      [JSON.stringify({ status: req.body.status }), String(req.params.id)]
    );
    if (res.rows.length === 0) throw notFound('Report');
    return { id: res.rows[0].id, status: req.body.status };
  })
);

// ---------- Reviews moderation
router.get(
  '/reviews',
  handle(async () => {
    const res = await query(
      `SELECT r.id, r.author_name, r.rating, r.comment, r.created_at, r.product_id, p.title
         FROM reviews r LEFT JOIN products p ON p.id = r.product_id ORDER BY r.created_at DESC LIMIT 200`
    );
    return res.rows.map((r) => ({
      id: r.id, author: r.author_name, rating: r.rating, comment: r.comment, createdAt: r.created_at,
      listingId: r.product_id, listingTitle: r.title || 'Deleted listing',
    }));
  })
);

router.delete(
  '/reviews/:id',
  handle(async (req) => {
    const res = await query(`DELETE FROM reviews WHERE id = $1 RETURNING id`, [String(req.params.id)]);
    if (res.rows.length === 0) throw notFound('Review');
    return { id: res.rows[0].id, deleted: true };
  })
);

// ---------- Subscription plans
const planFields = {
  name: z.string().trim().min(2, 'Enter a plan name').max(100),
  description: z.string().trim().max(500),
  price: z.coerce.number().min(0, 'The price cannot be negative'),
  durationDays: z.coerce.number().int().min(1, 'Duration must be at least 1 day').max(3650),
  listingLimit: z.coerce.number().int().min(0, 'The listing limit cannot be negative').max(100000),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
};

router.get('/plans', handle(() => SubscriptionService.listPlans(true)));

router.post(
  '/plans',
  validate(z.object({ ...planFields, description: planFields.description.optional(), isActive: planFields.isActive.optional(), sortOrder: planFields.sortOrder.optional() })),
  handle((req) => SubscriptionService.createPlan(req.body))
);

router.patch('/plans/:id', validate(z.object(planFields).partial()), handle((req) => SubscriptionService.updatePlan(String(req.params.id), req.body)));

router.get('/subscribers', handle(() => SubscriptionService.listSubscribers()));

// ---------- Subscription payments from hosts and providers
router.get('/payments', handle((req) => SubscriptionService.listPayments({ status: String(req.query.status || 'all') })));

// Record a payment received directly from a host / provider; their plan starts immediately
router.post(
  '/payments',
  validate(
    z.object({
      userId: z.string().min(1, 'Choose an account'),
      planId: z.string().min(1, 'Choose a plan'),
      method: z.enum(['bank_transfer', 'cash_deposit', 'online_transfer', 'cash']),
      reference: z.string().trim().min(2, 'Enter a reference or note').max(255),
    })
  ),
  handle((req) => SubscriptionService.recordPayment(req.body))
);

router.delete('/subscribers/:userId', handle((req) => SubscriptionService.cancelSubscription(String(req.params.userId))));

router.patch(
  '/payments/:id',
  validate(z.object({ status: z.enum(['paid', 'rejected']) })),
  handle((req) => SubscriptionService.reviewPayment(String(req.params.id), req.body.status))
);

// ---------- Messages between customers and hosts / providers (read-only, for moderation)
router.get(
  '/conversations',
  handle(async (req) => {
    const search = String(req.query.search || '').trim();
    const params: any[] = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE a.name ILIKE $1 OR b.name ILIKE $1 OR p.title ILIKE $1 OR c.last_message ILIKE $1`;
    }
    const res = await query(
      `SELECT c.id, c.last_message, c.updated_at, p.id AS listing_id, p.title AS listing_title,
              a.name AS user1_name, a.avatar AS user1_avatar, b.name AS user2_name, b.avatar AS user2_avatar,
              (SELECT count(*)::int FROM messages m WHERE m.conversation_id = c.id) AS message_count
         FROM conversations c
         LEFT JOIN users a ON a.id = c.user1_id LEFT JOIN users b ON b.id = c.user2_id
         LEFT JOIN products p ON p.id = c.listing_id
         ${where} ORDER BY c.updated_at DESC LIMIT 200`,
      params
    );
    return res.rows.map((r) => ({
      id: r.id, lastMessage: r.last_message, updatedAt: r.updated_at, listingId: r.listing_id, listingTitle: r.listing_title,
      participants: [{ name: r.user1_name, avatar: r.user1_avatar }, { name: r.user2_name, avatar: r.user2_avatar }],
      messageCount: r.message_count,
    }));
  })
);

router.get(
  '/conversations/:id/messages',
  handle(async (req) => {
    const res = await query(
      `SELECT m.id, m.text, m.created_at, u.name AS sender FROM messages m LEFT JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = $1 ORDER BY m.created_at ASC LIMIT 500`,
      [String(req.params.id)]
    );
    return res.rows.map((m) => ({ id: m.id, text: m.text, sender: m.sender || 'Deleted account', createdAt: m.created_at }));
  })
);

// Start (or continue) a direct conversation with a user, as BorrowLK support
router.post(
  '/messages',
  validate(z.object({ userId: z.string().min(1, 'Choose who to message'), text: z.string().trim().min(1, 'Write a message').max(2000) })),
  handle(async (req) => {
    const me = req.user!.id;
    const { userId, text } = req.body;
    const target = (await query(`SELECT id FROM users WHERE id = $1`, [userId])).rows[0];
    if (!target || userId === me) {
      const error: any = new Error('User not found.');
      error.code = 'USER_NOT_FOUND';
      error.status = 404;
      throw error;
    }
    const existing = await query(
      `SELECT id FROM conversations WHERE listing_id IS NULL AND ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)) LIMIT 1`,
      [me, userId]
    );
    const conversationId =
      existing.rows[0]?.id ||
      (await query(`INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) RETURNING id`, [me, userId])).rows[0].id;
    await query(`INSERT INTO messages (conversation_id, sender_id, receiver_id, text) VALUES ($1, $2, $3, $4)`, [conversationId, me, userId, text]);
    await query(`UPDATE conversations SET last_message = $1, updated_at = NOW() WHERE id = $2`, [text.slice(0, 200), conversationId]);
    await notify(userId, 'messages', 'New message from BorrowLK', text.slice(0, 140), '/messages');
    return { conversationId };
  })
);

// ---------- Announcements: a notification sent to a group of users
const AUDIENCES: Record<string, string> = {
  all: `role <> 'admin'`,
  hosts: `role <> 'admin' AND (host_status = 'approved' OR role = 'provider')`,
  providers: `role <> 'admin' AND provider_status = 'approved'`,
  customers: `role <> 'admin' AND host_status <> 'approved' AND provider_status <> 'approved' AND role <> 'provider'`,
};

router.post(
  '/announcements',
  validate(
    z.object({
      title: z.string().trim().min(3, 'Enter a title').max(120),
      message: z.string().trim().min(5, 'Enter a message').max(1000),
      audience: z.enum(['all', 'hosts', 'providers', 'customers']),
    })
  ),
  handle(async (req) => {
    const { title, message, audience } = req.body;
    const sent = await query(
      `INSERT INTO notifications (user_id, type, title, description)
       SELECT id, 'system', $1, $2 FROM users WHERE is_suspended = FALSE AND ${AUDIENCES[audience]} RETURNING id`,
      [title, message]
    );
    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, details) VALUES ($1, 'announcement', 'notification', $2)`,
      [req.user!.id, JSON.stringify({ title, message, audience, recipients: sent.rows.length })]
    );
    return { recipients: sent.rows.length };
  })
);

router.get(
  '/announcements',
  handle(async () => {
    const res = await query(
      `SELECT a.id, a.details, a.created_at, u.name AS sent_by FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id
        WHERE a.action = 'announcement' ORDER BY a.created_at DESC LIMIT 100`
    );
    return res.rows.map((r) => ({
      id: r.id, title: r.details?.title, message: r.details?.message, audience: r.details?.audience,
      recipients: r.details?.recipients ?? 0, sentBy: r.sent_by, createdAt: r.created_at,
    }));
  })
);

export default router;
