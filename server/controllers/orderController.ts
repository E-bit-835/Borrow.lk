import { Response, NextFunction } from 'express';
import { OrderService, OrderViewer } from '../services/orderService';
import { AuthRequest } from '../middleware/auth';

function viewerOf(req: AuthRequest): OrderViewer {
  return { id: req.user!.id, role: req.user!.role };
}

export class OrderController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.create(
        {
          ...req.body,
          userId: req.user!.id,
        },
        viewerOf(req)
      );
      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orders = await OrderService.getAll({
        userId: req.query.userId as string,
        providerId: req.query.providerId as string,
        clientId: req.query.clientId as string,
        status: req.query.status as string,
        search: req.query.search as string,
        // Non-admins only ever see orders they placed or received
        viewerId: req.user!.role === 'admin' ? undefined : req.user!.id,
      });
      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.getById(String(req.params.id), viewerOf(req));
      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const order = await OrderService.updateStatus(String(req.params.id), status, viewerOf(req));
      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}
