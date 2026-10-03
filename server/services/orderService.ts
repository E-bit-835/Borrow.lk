import { query } from '../config/db';
import { PredictionService, PredictionMethod } from './predictionService';
import { ProductService } from './productService';
import { notify } from '../utils/notify';

export interface CreateOrderDTO {
  userId: string;
  clientId?: string;
  productId: string;
  startDate: string;
  endDate: string;
  quantity?: number;
  predictionMethod?: PredictionMethod;
  /** Existing prediction (already run by this user) to attach to the order */
  predictionId?: string;
  predictionInputData?: Record<string, any>;
  predictionImageUrl?: string;
  notes?: string;
}

// A request starts pending; the host / provider accepts (confirmed) or rejects it
export type OrderStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'rejected';

/** The authenticated user making the request; used to scope what they can see and change. */
export interface OrderViewer {
  id: string;
  role: 'customer' | 'provider' | 'admin';
}

function httpError(message: string, code: string, status: number) {
  const error: any = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export class OrderService {
  static async create(data: CreateOrderDTO, viewer: OrderViewer) {
    const requester = await query(`SELECT is_suspended FROM users WHERE id = $1`, [data.userId]);
    if (requester.rows[0]?.is_suspended) {
      throw httpError('This account has been suspended.', 'ACCOUNT_SUSPENDED', 403);
    }

    // 1. Fetch Product (only published listings can be booked)
    const prodRes = await query(`SELECT * FROM products WHERE id = $1`, [data.productId]);
    if (prodRes.rows.length === 0 || prodRes.rows[0].status !== 'published') {
      throw httpError('Product not found.', 'PRODUCT_NOT_FOUND', 404);
    }
    const product = prodRes.rows[0];

    if (product.provider_id && product.provider_id === data.userId) {
      throw httpError('You cannot rent your own listing.', 'OWN_LISTING', 400);
    }

    // 2. Calculate duration server-side (inclusive of both start and end day)
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw httpError('Start date and end date must be valid dates.', 'INVALID_DATES', 400);
    }
    if (end.getTime() < start.getTime()) {
      throw httpError('End date cannot be before the start date.', 'INVALID_DATES', 400);
    }
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY) + 1);

    const availability = await ProductService.checkAvailability(data.productId, data.startDate, data.endDate);
    if (!availability.available) {
      throw httpError(availability.message, 'UNAVAILABLE', 409);
    }

    // Estimated cost only: BorrowLK takes no payment from renters, it is settled with the host / provider
    const quantity = Math.max(1, data.quantity || 1);
    const unit = product.price_unit || 'day';
    const periods =
      unit === 'week' ? Math.ceil(days / 7) : unit === 'month' ? Math.ceil(days / 30) : unit === 'day' || unit === 'night' ? days : 1;
    const dailyRate = parseFloat(product.price_per_day);
    const totalPrice = dailyRate * periods * quantity;
    let deposit = parseFloat(product.deposit || '0');

    // 3. The client record must belong to the user placing the order
    if (data.clientId) {
      const clientRes = await query(`SELECT user_id FROM clients WHERE id = $1`, [data.clientId]);
      const owned = clientRes.rows.length > 0 && (viewer.role === 'admin' || clientRes.rows[0].user_id === viewer.id);
      if (!owned) {
        throw httpError('Client not found.', 'CLIENT_NOT_FOUND', 404);
      }
    }

    // 4. Attach an existing prediction, or run one if a method was requested
    let predictionId: string | null = null;
    let predictionMethod: string | null = data.predictionMethod || null;
    let predictionResult: any = null;

    if (data.predictionId) {
      const predRes = await query(
        `SELECT id, user_id, prediction_method, prediction_result FROM predictions WHERE id = $1`,
        [data.predictionId]
      );
      const pred = predRes.rows[0];
      if (!pred || (viewer.role !== 'admin' && pred.user_id !== viewer.id)) {
        throw httpError('Prediction not found.', 'PREDICTION_NOT_FOUND', 404);
      }
      predictionId = pred.id;
      predictionMethod = pred.prediction_method;
      predictionResult =
        typeof pred.prediction_result === 'string' ? JSON.parse(pred.prediction_result) : pred.prediction_result;
    } else if (data.predictionMethod) {
      try {
        const pred = await PredictionService.execute({
          userId: data.userId,
          clientId: data.clientId,
          productId: data.productId,
          predictionMethod: data.predictionMethod,
          inputData: data.predictionInputData || {
            itemTitle: product.title,
            category: product.category,
            rentalDurationDays: days,
            productValueLkr: dailyRate * 10,
          },
          inputImageUrl: data.predictionImageUrl || (product.images?.[0] || null),
        });
        predictionId = pred.id;
        predictionResult = pred.predictionResult;
      } catch (err: any) {
        console.warn('⚠️ Non-fatal prediction execution error:', err.message);
      }
    }

    // Dynamic deposit override if the prediction recommended one
    const recommendedDeposit = Number(
      predictionResult?.calculatedDynamicDeposit ?? predictionResult?.recommendedDeposit
    );
    if (Number.isFinite(recommendedDeposit) && recommendedDeposit > 0) {
      deposit = recommendedDeposit;
    }

    // 5. Insert with the next order number; retry if a concurrent order took it
    const year = new Date().getFullYear();
    let createdId: string | null = null;
    for (let attempt = 0; attempt < 5 && !createdId; attempt++) {
      const seqRes = await query(
        `SELECT COALESCE(MAX(substring(order_number from '([0-9]+)$')::int), 1000) + 1 AS next FROM orders`
      );
      const orderNumber = `BLK-${year}-${seqRes.rows[0].next}`;

      try {
        const res = await query(
          `INSERT INTO orders (
             order_number, user_id, client_id, provider_id, product_id,
             start_date, end_date, days, daily_rate, total_price, deposit,
             status, prediction_method, prediction_id, notes, quantity
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           RETURNING id`,
          [
            orderNumber,
            data.userId,
            data.clientId || null,
            product.provider_id || null,
            data.productId,
            data.startDate,
            data.endDate,
            days,
            dailyRate,
            totalPrice,
            deposit,
            'pending',
            predictionMethod,
            predictionId,
            data.notes || null,
            quantity,
          ]
        );
        createdId = res.rows[0].id;
      } catch (err: any) {
        const isOrderNumberClash = err.code === '23505' && String(err.constraint || '').includes('order_number');
        if (!isOrderNumberClash) throw err;
      }
    }

    if (!createdId) {
      throw httpError('Could not allocate an order number. Please try again.', 'ORDER_NUMBER_CONFLICT', 503);
    }

    // If client is present, increment rental count and total spent
    if (data.clientId) {
      await query(
        `UPDATE clients SET total_rentals = total_rentals + 1, total_spent = total_spent + $1 WHERE id = $2`,
        [totalPrice, data.clientId]
      );
    }

    const isService = product.listing_type === 'service';
    await notify(
      product.provider_id,
      'bookings',
      isService ? 'New service request' : 'New rental request',
      `Someone asked for "${product.title}". Accept or decline it.`,
      '/provider/requests'
    );

    return this.getById(createdId, viewer);
  }

  static async getAll(filters: {
    userId?: string;
    clientId?: string;
    providerId?: string;
    status?: string;
    search?: string;
    /** When set, only orders this user placed or received are returned */
    viewerId?: string;
  }) {
    let sql = `
      SELECT o.*,
             p.title AS product_title,
             p.category AS product_category,
             p.images AS product_images,
             p.location AS product_location,
             p.listing_type AS product_listing_type,
             p.price_unit AS product_price_unit,
             c.name AS client_name,
             c.phone AS client_phone,
             c.email AS client_email,
             c.company AS client_company,
             u.name AS customer_name,
             u.email AS customer_email,
             prov.name AS provider_name,
             prov.business_name AS provider_business_name,
             prov.phone AS provider_phone,
             prov.city AS provider_city,
             prov.district AS provider_district,
             pred.model_name AS prediction_model_name,
             pred.confidence_score AS prediction_confidence_score,
             pred.prediction_result AS prediction_result
      FROM orders o
      JOIN products p ON o.product_id = p.id
      LEFT JOIN clients c ON o.client_id = c.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users prov ON o.provider_id = prov.id
      LEFT JOIN predictions pred ON o.prediction_id = pred.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (filters.viewerId) {
      sql += ` AND (o.user_id = $${idx} OR o.provider_id = $${idx})`;
      params.push(filters.viewerId);
      idx++;
    }

    if (filters.userId) {
      sql += ` AND o.user_id = $${idx}`;
      params.push(filters.userId);
      idx++;
    }

    if (filters.providerId) {
      sql += ` AND o.provider_id = $${idx}`;
      params.push(filters.providerId);
      idx++;
    }

    if (filters.clientId) {
      sql += ` AND o.client_id = $${idx}`;
      params.push(filters.clientId);
      idx++;
    }

    if (filters.status && filters.status !== 'all') {
      sql += ` AND o.status = $${idx}`;
      params.push(filters.status);
      idx++;
    }

    if (filters.search) {
      sql += ` AND (o.order_number ILIKE $${idx} OR p.title ILIKE $${idx} OR c.name ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    sql += ` ORDER BY o.created_at DESC`;

    const res = await query(sql, params);
    return res.rows.map(this.formatOrder);
  }

  static async getById(id: string, viewer: OrderViewer) {
    const res = await query(
      `SELECT o.*,
              p.title AS product_title,
              p.category AS product_category,
              p.images AS product_images,
              p.location AS product_location,
             p.listing_type AS product_listing_type,
             p.price_unit AS product_price_unit,
              p.specifications AS product_specifications,
              c.name AS client_name,
              c.phone AS client_phone,
              c.email AS client_email,
              c.company AS client_company,
              c.city AS client_city,
              c.district AS client_district,
              u.name AS customer_name,
              u.email AS customer_email,
              prov.name AS provider_name,
              prov.business_name AS provider_business_name,
              prov.phone AS provider_phone,
              prov.city AS provider_city,
              prov.district AS provider_district,
              pred.model_name AS prediction_model_name,
              pred.confidence_score AS prediction_confidence_score,
              pred.prediction_result AS prediction_result,
              pred.input_data AS prediction_input_data
       FROM orders o
       JOIN products p ON o.product_id = p.id
       LEFT JOIN clients c ON o.client_id = c.id
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN users prov ON o.provider_id = prov.id
       LEFT JOIN predictions pred ON o.prediction_id = pred.id
       WHERE o.id = $1 OR o.order_number = $1`,
      [id]
    );

    const order = res.rows.length > 0 ? this.formatOrder(res.rows[0]) : null;
    const canView =
      !!order && (viewer.role === 'admin' || order.userId === viewer.id || order.providerId === viewer.id);

    // Same response for a missing order and one the viewer may not see, so IDs cannot be probed
    if (!order || !canView) {
      throw httpError('Order not found.', 'ORDER_NOT_FOUND', 404);
    }

    return order;
  }

  static async updateStatus(id: string, status: OrderStatus, viewer: OrderViewer) {
    // Accepts either the internal id or the public order number; also enforces access
    const order = await this.getById(id, viewer);

    const isAdmin = viewer.role === 'admin';
    const isProvider = order.providerId === viewer.id;
    if (!isAdmin && !isProvider) {
      // The customer may only cancel, and only before the rental / service has started
      if (status !== 'cancelled') {
        throw httpError('Only the provider can change this booking status.', 'FORBIDDEN', 403);
      }
      if (!['pending', 'confirmed'].includes(order.status)) {
        throw httpError(`A booking that is ${order.status} cannot be cancelled.`, 'INVALID_STATUS_CHANGE', 400);
      }
    }

    // Two accepted requests must never cover the same days
    if (status === 'confirmed' && order.status !== 'confirmed') {
      const toDay = (d: any) => new Date(d).toLocaleDateString('en-CA');
      const clash = await query(
        `SELECT 1 FROM orders WHERE product_id = $1 AND status IN ('confirmed', 'active')
            AND start_date <= $3::date AND end_date >= $2::date AND id <> $4 LIMIT 1`,
        [order.productId, toDay(order.startDate), toDay(order.endDate), order.id]
      );
      if (clash.rows.length > 0) {
        throw httpError('Another accepted request already covers these dates.', 'UNAVAILABLE', 409);
      }
    }

    await query(`UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`, [status, order.id]);

    // Tell the other side what happened
    const WORDS: Record<string, string> = { confirmed: 'accepted', rejected: 'declined', cancelled: 'cancelled', completed: 'marked as completed', active: 'started' };
    if (WORDS[status]) {
      const byCustomer = viewer.id === order.userId;
      await notify(
        byCustomer ? order.providerId : order.userId,
        'bookings',
        `Request ${WORDS[status]}`,
        `${order.orderNumber} for "${order.product.title}" was ${WORDS[status]}${byCustomer ? ' by the customer' : ''}.`,
        byCustomer ? '/provider/requests' : `/bookings/${order.orderNumber}`
      );
    }

    return this.getById(order.id, viewer);
  }

  private static formatOrder(row: any) {
    const images = typeof row.product_images === 'string' ? JSON.parse(row.product_images) : (row.product_images || []);
    return {
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      clientId: row.client_id,
      providerId: row.provider_id,
      productId: row.product_id,
      startDate: row.start_date,
      endDate: row.end_date,
      days: parseInt(row.days, 10),
      quantity: parseInt(row.quantity ?? 1, 10),
      dailyRate: parseFloat(row.daily_rate),
      totalPrice: parseFloat(row.total_price),
      deposit: parseFloat(row.deposit || '0'),
      status: row.status,
      predictionMethod: row.prediction_method,
      predictionId: row.prediction_id,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Joined relations
      product: {
        id: row.product_id,
        title: row.product_title,
        category: row.product_category,
        image: images[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600',
        images,
        location: row.product_location,
        listingType: row.product_listing_type || 'rental',
        priceUnit: row.product_price_unit || 'day',
      },
      client: row.client_id ? {
        id: row.client_id,
        name: row.client_name,
        phone: row.client_phone,
        email: row.client_email,
        company: row.client_company,
        city: row.client_city,
        district: row.client_district,
      } : null,
      customer: {
        id: row.user_id,
        name: row.customer_name,
        email: row.customer_email,
      },
      provider: {
        id: row.provider_id,
        name: row.provider_business_name || row.provider_name,
        phone: row.provider_phone,
        city: row.provider_city,
        district: row.provider_district,
      },
      prediction: row.prediction_id ? {
        id: row.prediction_id,
        method: row.prediction_method,
        modelName: row.prediction_model_name,
        confidenceScore: parseFloat(row.prediction_confidence_score || '0'),
        result: typeof row.prediction_result === 'string' ? JSON.parse(row.prediction_result) : row.prediction_result,
        inputData: typeof row.prediction_input_data === 'string' ? JSON.parse(row.prediction_input_data) : row.prediction_input_data,
      } : null,
    };
  }
}
