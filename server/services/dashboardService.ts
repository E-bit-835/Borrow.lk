import { query } from '../config/db';

export class DashboardService {
  static async getCustomerStats(userId?: string) {
    const activeRentalsRes = await query(
      `SELECT COUNT(*) AS total FROM orders WHERE status IN ('pending', 'confirmed', 'active') ${userId ? 'AND user_id = $1' : ''}`,
      userId ? [userId] : []
    );

    const totalSpentRes = await query(
      `SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE status = 'completed' ${userId ? 'AND user_id = $1' : ''}`,
      userId ? [userId] : []
    );

    const wishlistCountRes = await query(`SELECT COUNT(*) AS total FROM products WHERE available_now = TRUE`);
    const predictionsCountRes = await query(
      `SELECT COUNT(*) AS total FROM predictions ${userId ? 'WHERE user_id = $1' : ''}`,
      userId ? [userId] : []
    );

    return {
      activeRentals: parseInt(activeRentalsRes.rows[0].total, 10),
      totalSpent: parseFloat(totalSpentRes.rows[0].total),
      savedItemsCount: parseInt(wishlistCountRes.rows[0].total, 10),
      predictionsGenerated: parseInt(predictionsCountRes.rows[0].total, 10),
      trustScore: 4.95,
    };
  }

  static async getProviderStats(providerId?: string) {
    const activeListingsRes = await query(
      `SELECT COUNT(*) AS total FROM products WHERE status = 'published' ${providerId ? 'AND provider_id = $1' : ''}`,
      providerId ? [providerId] : []
    );

    const activeBookingsRes = await query(
      `SELECT COUNT(*) AS total FROM orders WHERE status IN ('confirmed', 'active') ${providerId ? 'AND provider_id = $1' : ''}`,
      providerId ? [providerId] : []
    );

    const totalEarningsRes = await query(
      `SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE status = 'completed' ${providerId ? 'AND provider_id = $1' : ''}`,
      providerId ? [providerId] : []
    );

    const totalClientsRes = await query(
      `SELECT COUNT(DISTINCT client_id) AS total FROM orders WHERE client_id IS NOT NULL ${providerId ? 'AND provider_id = $1' : ''}`,
      providerId ? [providerId] : []
    );

    return {
      activeListings: parseInt(activeListingsRes.rows[0].total, 10),
      activeBookings: parseInt(activeBookingsRes.rows[0].total, 10),
      totalEarnings: parseFloat(totalEarningsRes.rows[0].total),
      totalClients: parseInt(totalClientsRes.rows[0].total, 10),
      rating: 4.92,
      responseRate: '99%',
      avgResponseTime: '< 15 mins',
    };
  }

  static async getAdminStats() {
    const usersCount = await query(`SELECT COUNT(*) AS total FROM users`);
    const listingsCount = await query(`SELECT COUNT(*) AS total FROM products`);
    const ordersCount = await query(`SELECT COUNT(*) AS total FROM orders`);
    const predictionsCount = await query(`SELECT COUNT(*) AS total FROM predictions`);
    const totalVolume = await query(`SELECT COALESCE(SUM(total_price), 0) AS total FROM orders`);

    return {
      totalUsers: parseInt(usersCount.rows[0].total, 10),
      totalListings: parseInt(listingsCount.rows[0].total, 10),
      totalOrders: parseInt(ordersCount.rows[0].total, 10),
      totalPredictions: parseInt(predictionsCount.rows[0].total, 10),
      grossPlatformVolume: parseFloat(totalVolume.rows[0].total),
      activePlatformFeeRate: '8.5%',
    };
  }
}
