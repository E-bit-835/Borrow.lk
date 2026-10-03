import { query } from '../config/db';
import { notify } from '../utils/notify';

/**
 * Provider-side monetisation: hosts and providers buy a plan to publish more listings.
 * Customers never pay. There is no card gateway: a host submits a payment (e.g. a bank
 * transfer reference) and an administrator confirms it, which activates the plan.
 */
function httpError(message: string, code: string, status: number) {
  const error: any = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

export const formatPlan = (r: any) => ({
  id: r.id,
  name: r.name,
  description: r.description || '',
  price: parseFloat(r.price),
  durationDays: r.duration_days,
  listingLimit: r.listing_limit,
  isActive: r.is_active,
  isDefault: r.is_default,
  sortOrder: r.sort_order,
  subscribers: r.subscribers ?? undefined,
});

export interface PlanInput {
  name?: string;
  description?: string;
  price?: number;
  durationDays?: number;
  listingLimit?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export class SubscriptionService {
  // ---------- Plans
  static async listPlans(includeInactive: boolean) {
    const res = await query(
      `SELECT p.*, (SELECT count(*)::int FROM subscriptions s WHERE s.plan_id = p.id AND s.expires_at > NOW()) AS subscribers
         FROM subscription_plans p ${includeInactive ? '' : 'WHERE p.is_active = TRUE'}
        ORDER BY p.sort_order, p.price`
    );
    return res.rows.map(formatPlan);
  }

  static async createPlan(data: Required<Pick<PlanInput, 'name' | 'price' | 'durationDays' | 'listingLimit'>> & PlanInput) {
    const id = `plan_${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}_${Date.now().toString(36)}`;
    const res = await query(
      `INSERT INTO subscription_plans (id, name, description, price, duration_days, listing_limit, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, data.name, data.description || '', data.price, data.durationDays, data.listingLimit, data.isActive ?? true, data.sortOrder ?? 99]
    );
    return formatPlan(res.rows[0]);
  }

  static async updatePlan(id: string, data: PlanInput) {
    const current = await query(`SELECT * FROM subscription_plans WHERE id = $1`, [id]);
    if (current.rows.length === 0) throw httpError('Plan not found.', 'NOT_FOUND', 404);
    const plan = current.rows[0];
    // The free plan is what everyone falls back to, so it must stay free and available
    if (plan.is_default && ((data.price !== undefined && data.price !== 0) || data.isActive === false)) {
      throw httpError('The free plan must stay free and active. You can change its name and listing limit.', 'DEFAULT_PLAN', 400);
    }

    const columns: Record<string, string> = {
      name: 'name', description: 'description', price: 'price', durationDays: 'duration_days',
      listingLimit: 'listing_limit', isActive: 'is_active', sortOrder: 'sort_order',
    };
    const sets: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (!columns[key] || value === undefined) continue;
      values.push(value);
      sets.push(`${columns[key]} = $${values.length}`);
    }
    if (sets.length > 0) {
      values.push(id);
      await query(`UPDATE subscription_plans SET ${sets.join(', ')} WHERE id = $${values.length}`, values);
    }
    return formatPlan((await query(`SELECT * FROM subscription_plans WHERE id = $1`, [id])).rows[0]);
  }

  // ---------- What a host is entitled to right now
  static async entitlement(userId: string) {
    const res = await query(
      `SELECT p.*, s.expires_at FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id
        WHERE s.user_id = $1 AND s.expires_at > NOW()`,
      [userId]
    );
    const row = res.rows[0] || (await query(`SELECT * FROM subscription_plans WHERE is_default = TRUE LIMIT 1`)).rows[0];
    const used = await query(`SELECT count(*)::int n FROM products WHERE provider_id = $1 AND status IN ('published', 'paused')`, [userId]);
    return {
      plan: row ? formatPlan(row) : null,
      expiresAt: res.rows[0]?.expires_at || null,
      listingsUsed: used.rows[0].n as number,
      // No plans configured at all means no limit, so a fresh database still works
      listingLimit: row ? (row.listing_limit as number) : null,
    };
  }

  /** Called before a listing is published. */
  static async assertCanPublish(userId: string) {
    const e = await this.entitlement(userId);
    if (e.listingLimit !== null && e.listingsUsed >= e.listingLimit) {
      throw httpError(
        `Your ${e.plan?.name || 'current'} plan allows ${e.listingLimit} listing${e.listingLimit === 1 ? '' : 's'}. Upgrade your plan or remove a listing to add another.`,
        'LISTING_LIMIT_REACHED',
        403
      );
    }
  }

  // ---------- Payments
  static async submitPayment(userId: string, data: { planId: string; method: string; reference: string }) {
    const planRes = await query(`SELECT * FROM subscription_plans WHERE id = $1 AND is_active = TRUE`, [data.planId]);
    const plan = planRes.rows[0];
    if (!plan) throw httpError('Plan not found.', 'NOT_FOUND', 404);
    if (plan.is_default || parseFloat(plan.price) === 0) throw httpError('The free plan does not need a payment.', 'FREE_PLAN', 400);
    const open = await query(`SELECT 1 FROM subscription_payments WHERE user_id = $1 AND status = 'pending'`, [userId]);
    if (open.rows.length > 0) {
      throw httpError('You already have a payment waiting for confirmation.', 'PAYMENT_PENDING', 400);
    }
    const res = await query(
      `INSERT INTO subscription_payments (user_id, plan_id, plan_name, amount, method, reference) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, plan.id, plan.name, plan.price, data.method, data.reference]
    );
    return this.formatPayment(res.rows[0]);
  }

  static async listPayments(filters: { status?: string; userId?: string }) {
    const params: any[] = [];
    let where = 'WHERE 1=1';
    if (filters.status && filters.status !== 'all') {
      params.push(filters.status);
      where += ` AND sp.status = $${params.length}`;
    }
    if (filters.userId) {
      params.push(filters.userId);
      where += ` AND sp.user_id = $${params.length}`;
    }
    const res = await query(
      `SELECT sp.*, u.name AS user_name, u.email AS user_email FROM subscription_payments sp
         LEFT JOIN users u ON u.id = sp.user_id ${where} ORDER BY sp.created_at DESC LIMIT 300`,
      params
    );
    return res.rows.map(this.formatPayment);
  }

  /** Admin decision. Confirming a payment starts (or renews) the subscription. */
  static async reviewPayment(id: string, status: 'paid' | 'rejected') {
    const res = await query(`SELECT * FROM subscription_payments WHERE id = $1`, [id]);
    const payment = res.rows[0];
    if (!payment) throw httpError('Payment not found.', 'NOT_FOUND', 404);
    if (payment.status !== 'pending') throw httpError('This payment has already been reviewed.', 'ALREADY_REVIEWED', 400);

    await query(`UPDATE subscription_payments SET status = $1, reviewed_at = NOW() WHERE id = $2`, [status, id]);

    if (status === 'paid') {
      const plan = (await query(`SELECT duration_days FROM subscription_plans WHERE id = $1`, [payment.plan_id])).rows[0];
      const days = plan?.duration_days || 30;
      await query(
        `INSERT INTO subscriptions (user_id, plan_id, started_at, expires_at) VALUES ($1, $2, NOW(), NOW() + ($3 || ' days')::interval)
         ON CONFLICT (user_id) DO UPDATE SET
           plan_id = EXCLUDED.plan_id,
           started_at = NOW(),
           -- Renewing the same plan early adds time instead of losing the remaining days
           expires_at = CASE WHEN subscriptions.plan_id = EXCLUDED.plan_id AND subscriptions.expires_at > NOW()
                             THEN subscriptions.expires_at + ($3 || ' days')::interval
                             ELSE NOW() + ($3 || ' days')::interval END`,
        [payment.user_id, payment.plan_id, String(days)]
      );
      await notify(payment.user_id, 'system', 'Payment confirmed', `Your ${payment.plan_name} plan is now active.`, '/provider/subscription');
    } else {
      await notify(payment.user_id, 'system', 'Payment not confirmed', `We could not confirm your payment for the ${payment.plan_name} plan. Please check the reference and submit it again.`, '/provider/subscription');
    }
    return this.formatPayment((await query(`SELECT sp.*, u.name AS user_name, u.email AS user_email FROM subscription_payments sp LEFT JOIN users u ON u.id = sp.user_id WHERE sp.id = $1`, [id])).rows[0]);
  }

  /** Admin records a payment they received directly (cash, phone, bank) and activates the plan at once. */
  static async recordPayment(data: { userId: string; planId: string; method: string; reference: string }) {
    const user = (await query(`SELECT id, role FROM users WHERE id = $1`, [data.userId])).rows[0];
    if (!user || user.role === 'admin') throw httpError('Choose a host or provider account.', 'USER_NOT_FOUND', 404);
    const plan = (await query(`SELECT * FROM subscription_plans WHERE id = $1`, [data.planId])).rows[0];
    if (!plan) throw httpError('Plan not found.', 'NOT_FOUND', 404);
    if (plan.is_default) throw httpError('Everyone is on the free plan already. Choose a paid plan.', 'FREE_PLAN', 400);

    const res = await query(
      `INSERT INTO subscription_payments (user_id, plan_id, plan_name, amount, method, reference) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user.id, plan.id, plan.name, plan.price, data.method, data.reference]
    );
    return this.reviewPayment(res.rows[0].id, 'paid');
  }

  /** Admin ends a subscription now; the account falls back to the free plan. */
  static async cancelSubscription(userId: string) {
    const res = await query(
      `DELETE FROM subscriptions s USING subscription_plans p WHERE s.user_id = $1 AND p.id = s.plan_id RETURNING p.name`,
      [userId]
    );
    if (res.rows.length === 0) throw httpError('This account has no subscription.', 'NOT_FOUND', 404);
    await notify(userId, 'system', 'Subscription ended', `Your ${res.rows[0].name} plan has ended. You are now on the free plan.`, '/provider/subscription');
    return { userId, cancelled: true };
  }

  static async listSubscribers() {
    const res = await query(
      `SELECT s.user_id, s.started_at, s.expires_at, p.name AS plan_name, u.name, u.email, u.avatar
         FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id JOIN users u ON u.id = s.user_id
        ORDER BY s.expires_at DESC LIMIT 300`
    );
    return res.rows.map((r) => ({
      userId: r.user_id, name: r.name, email: r.email, avatar: r.avatar, planName: r.plan_name,
      startedAt: r.started_at, expiresAt: r.expires_at, active: new Date(r.expires_at) > new Date(),
    }));
  }

  private static formatPayment(r: any) {
    return {
      id: r.id, userId: r.user_id, userName: r.user_name, userEmail: r.user_email, planId: r.plan_id, planName: r.plan_name,
      amount: parseFloat(r.amount), method: r.method, reference: r.reference, status: r.status,
      createdAt: r.created_at, reviewedAt: r.reviewed_at,
    };
  }
}
