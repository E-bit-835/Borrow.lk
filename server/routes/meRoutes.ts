import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { query } from '../config/db';
import { ProductService } from '../services/productService';
import { notify } from '../utils/notify';

/** The signed-in account's own data: summary, wishlist, messages, notifications, reviews, password. */
const router = Router();
router.use(requireAuth);

type Handler = (req: AuthRequest, res: Response) => Promise<unknown>;
const handle = (fn: Handler, status = 200) => async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.status(status).json({ success: true, data: await fn(req, res) });
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

// ---------- Summary for the dashboard and the sidebar badges
router.get(
  '/summary',
  handle(async (req) => {
    const res = await query(
      `SELECT
         (SELECT count(*)::int FROM orders WHERE user_id = $1 AND status = 'pending') AS pending_requests,
         (SELECT count(*)::int FROM orders WHERE user_id = $1 AND status IN ('confirmed', 'active') AND end_date >= CURRENT_DATE) AS upcoming,
         (SELECT count(*)::int FROM orders WHERE user_id = $1 AND status = 'completed') AS completed,
         (SELECT count(*)::int FROM wishlist_items WHERE user_id = $1) AS wishlist,
         (SELECT count(*)::int FROM messages WHERE receiver_id = $1 AND is_read = FALSE) AS unread_messages,
         (SELECT count(*)::int FROM notifications WHERE user_id = $1 AND is_read = FALSE) AS unread_notifications`,
      [req.user!.id]
    );
    const r = res.rows[0];
    return {
      pendingRequests: r.pending_requests, upcoming: r.upcoming, completed: r.completed, wishlist: r.wishlist,
      unreadMessages: r.unread_messages, unreadNotifications: r.unread_notifications,
    };
  })
);

// ---------- Wishlist
router.get(
  '/wishlist',
  handle(async (req) => {
    const res = await query(`SELECT product_id FROM wishlist_items WHERE user_id = $1 ORDER BY created_at DESC`, [req.user!.id]);
    const ids = res.rows.map((r) => r.product_id);
    if (ids.length === 0) return [];
    const products = await ProductService.getAll({ ids });
    // Keep the "most recently saved first" order
    return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  })
);

router.put(
  '/wishlist/:productId',
  handle(async (req) => {
    const productId = String(req.params.productId);
    const exists = await query(`SELECT 1 FROM products WHERE id = $1 AND status = 'published'`, [productId]);
    if (exists.rows.length === 0) throw httpError('Listing not found.', 'PRODUCT_NOT_FOUND', 404);
    await query(`INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [req.user!.id, productId]);
    return { productId, saved: true };
  })
);

router.delete(
  '/wishlist/:productId',
  handle(async (req) => {
    await query(`DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2`, [req.user!.id, String(req.params.productId)]);
    return { productId: String(req.params.productId), saved: false };
  })
);

// ---------- Notifications
router.get(
  '/notifications',
  handle(async (req) => {
    const res = await query(
      `SELECT id, type, title, description, is_read, action_url, created_at FROM notifications
        WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.user!.id]
    );
    return res.rows.map((r) => ({
      id: r.id, type: r.type, title: r.title, description: r.description, read: r.is_read, actionUrl: r.action_url, createdAt: r.created_at,
    }));
  })
);

router.post(
  '/notifications/read',
  validate(z.object({ id: z.string().optional() })),
  handle(async (req) => {
    // One notification when an id is given, otherwise all of them
    if (req.body.id) {
      await query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND id = $2`, [req.user!.id, req.body.id]);
    } else {
      await query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`, [req.user!.id]);
    }
    return { ok: true };
  })
);

// ---------- Messages
const textSchema = z.string().trim().min(1, 'Write a message').max(2000);

/** Loads a conversation and makes sure the signed-in user is one of its two members. */
async function myConversation(id: string, userId: string) {
  const res = await query(`SELECT * FROM conversations WHERE id = $1`, [id]);
  const c = res.rows[0];
  if (!c || (c.user1_id !== userId && c.user2_id !== userId)) {
    throw httpError('Conversation not found.', 'NOT_FOUND', 404);
  }
  return c;
}

async function addMessage(conversation: any, senderId: string, senderName: string, text: string) {
  const receiverId = conversation.user1_id === senderId ? conversation.user2_id : conversation.user1_id;
  const res = await query(
    `INSERT INTO messages (conversation_id, sender_id, receiver_id, text) VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
    [conversation.id, senderId, receiverId, text]
  );
  await query(`UPDATE conversations SET last_message = $1, updated_at = NOW() WHERE id = $2`, [text.slice(0, 200), conversation.id]);
  const receiver = await query(`SELECT role FROM users WHERE id = $1`, [receiverId]);
  await notify(receiverId, 'messages', `New message from ${senderName}`, text.slice(0, 140), receiver.rows[0]?.role === 'admin' ? '/admin/messages' : '/messages');
  return { id: res.rows[0].id, text, mine: true, createdAt: res.rows[0].created_at };
}

router.get(
  '/conversations',
  handle(async (req) => {
    const me = req.user!.id;
    const res = await query(
      `SELECT c.id, c.last_message, c.updated_at, c.listing_id, p.title AS listing_title,
              u.id AS other_id,
              CASE WHEN u.role = 'admin' AND $2 <> 'admin' THEN 'BorrowLK Support' ELSE COALESCE(u.business_name, u.name) END AS other_name,
              u.avatar AS other_avatar,
              (SELECT count(*)::int FROM messages m WHERE m.conversation_id = c.id AND m.receiver_id = $1 AND m.is_read = FALSE) AS unread
         FROM conversations c
         JOIN users u ON u.id = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END
         LEFT JOIN products p ON p.id = c.listing_id
        WHERE c.user1_id = $1 OR c.user2_id = $1
        ORDER BY c.updated_at DESC LIMIT 100`,
      [me, req.user!.role]
    );
    return res.rows.map((r) => ({
      id: r.id, lastMessage: r.last_message, updatedAt: r.updated_at, listingId: r.listing_id, listingTitle: r.listing_title,
      otherUser: { id: r.other_id, name: r.other_name, avatar: r.other_avatar }, unread: r.unread,
    }));
  })
);

router.get(
  '/conversations/:id/messages',
  handle(async (req) => {
    const me = req.user!.id;
    const conversation = await myConversation(String(req.params.id), me);
    // Opening a conversation marks what the other person sent as read
    await query(`UPDATE messages SET is_read = TRUE WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = FALSE`, [conversation.id, me]);
    const res = await query(
      `SELECT id, sender_id, text, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 500`,
      [conversation.id]
    );
    return res.rows.map((m) => ({ id: m.id, text: m.text, mine: m.sender_id === me, createdAt: m.created_at }));
  })
);

router.post(
  '/conversations/:id/messages',
  validate(z.object({ text: textSchema })),
  handle(async (req) => {
    const conversation = await myConversation(String(req.params.id), req.user!.id);
    return addMessage(conversation, req.user!.id, req.user!.name, req.body.text);
  }, 201)
);

// Start (or continue) a conversation with the owner of a listing
router.post(
  '/messages',
  validate(z.object({ listingId: z.string().min(1), text: textSchema })),
  handle(async (req) => {
    const me = req.user!.id;
    const listing = await query(`SELECT id, provider_id FROM products WHERE id = $1`, [req.body.listingId]);
    const ownerId = listing.rows[0]?.provider_id;
    if (!ownerId) throw httpError('Listing not found.', 'PRODUCT_NOT_FOUND', 404);
    if (ownerId === me) throw httpError('This is your own listing.', 'OWN_LISTING', 400);

    const existing = await query(
      `SELECT * FROM conversations WHERE listing_id = $1 AND ((user1_id = $2 AND user2_id = $3) OR (user1_id = $3 AND user2_id = $2)) LIMIT 1`,
      [req.body.listingId, me, ownerId]
    );
    const conversation =
      existing.rows[0] ||
      (await query(`INSERT INTO conversations (user1_id, user2_id, listing_id) VALUES ($1, $2, $3) RETURNING *`, [me, ownerId, req.body.listingId])).rows[0];

    const message = await addMessage(conversation, me, req.user!.name, req.body.text);
    return { conversationId: conversation.id, message };
  }, 201)
);

// Write to BorrowLK support: opens (or continues) a conversation with an administrator
router.post(
  '/support',
  validate(z.object({ text: textSchema })),
  handle(async (req) => {
    const me = req.user!.id;
    // Continue an existing support conversation if there is one, otherwise pick the first administrator
    const existing = await query(
      `SELECT c.* FROM conversations c JOIN users u ON u.id = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END
        WHERE c.listing_id IS NULL AND (c.user1_id = $1 OR c.user2_id = $1) AND u.role = 'admin'
        ORDER BY c.updated_at DESC LIMIT 1`,
      [me]
    );
    let conversation = existing.rows[0];
    if (!conversation) {
      const admin = await query(`SELECT id FROM users WHERE role = 'admin' AND is_suspended = FALSE AND id <> $1 ORDER BY created_at ASC LIMIT 1`, [me]);
      if (admin.rows.length === 0) throw httpError('Support is not available right now.', 'NO_SUPPORT', 503);
      conversation = (await query(`INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) RETURNING *`, [me, admin.rows[0].id])).rows[0];
    }
    const message = await addMessage(conversation, me, req.user!.name, req.body.text);
    return { conversationId: conversation.id, message };
  }, 201)
);

// ---------- Reviews: one per customer per listing, only after a completed rental / service
router.post(
  '/reviews',
  validate(z.object({ orderId: z.string().min(1), rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().min(5, 'Write a few words about your experience').max(1000) })),
  handle(async (req) => {
    const me = req.user!.id;
    const orderRes = await query(`SELECT id, product_id, provider_id, status FROM orders WHERE (id = $1 OR order_number = $1) AND user_id = $2`, [req.body.orderId, me]);
    const order = orderRes.rows[0];
    if (!order) throw httpError('Booking not found.', 'ORDER_NOT_FOUND', 404);
    if (order.status !== 'completed') throw httpError('You can review a booking once it is completed.', 'NOT_COMPLETED', 400);
    const already = await query(`SELECT 1 FROM reviews WHERE product_id = $1 AND user_id = $2`, [order.product_id, me]);
    if (already.rows.length > 0) throw httpError('You have already reviewed this listing.', 'ALREADY_REVIEWED', 400);

    const author = await query(`SELECT name, avatar FROM users WHERE id = $1`, [me]);
    const res = await query(
      `INSERT INTO reviews (product_id, user_id, author_name, author_avatar, rating, comment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [order.product_id, me, author.rows[0].name, author.rows[0].avatar, req.body.rating, req.body.comment]
    );
    // Keep the listing's displayed rating in step with its reviews
    await query(
      `UPDATE products SET rating = sub.avg, reviews_count = sub.n
         FROM (SELECT round(avg(rating)::numeric, 2) AS avg, count(*)::int AS n FROM reviews WHERE product_id = $1) sub
        WHERE id = $1`,
      [order.product_id]
    );
    await notify(order.provider_id, 'system', 'New review', `${author.rows[0].name} left a ${req.body.rating}-star review.`, '/provider/reviews');
    return { id: res.rows[0].id };
  }, 201)
);

router.get(
  '/reviews',
  handle(async (req) => {
    const res = await query(`SELECT product_id FROM reviews WHERE user_id = $1`, [req.user!.id]);
    return res.rows.map((r) => r.product_id);
  })
);

// ---------- Password
router.post(
  '/password',
  validate(z.object({ currentPassword: z.string().min(1, 'Enter your current password'), newPassword: z.string().min(8, 'The new password must be at least 8 characters') })),
  handle(async (req) => {
    const res = await query(`SELECT password_hash FROM users WHERE id = $1`, [req.user!.id]);
    const ok = res.rows[0] && (await bcrypt.compare(req.body.currentPassword, res.rows[0].password_hash));
    if (!ok) throw httpError('Your current password is not correct.', 'INVALID_CREDENTIALS', 400);
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [await bcrypt.hash(req.body.newPassword, 10), req.user!.id]);
    return { changed: true };
  })
);

export default router;
