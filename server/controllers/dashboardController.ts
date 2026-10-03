import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService';
import { AuthRequest } from '../middleware/auth';

export class DashboardController {
  static async getCustomerDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await DashboardService.getCustomerStats(req.user?.id);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProviderDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await DashboardService.getProviderStats(req.user?.id);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminDashboard(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await DashboardService.getAdminStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
