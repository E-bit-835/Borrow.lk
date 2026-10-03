import { Response, NextFunction } from 'express';
import { ClientService, ClientViewer } from '../services/clientService';
import { AuthRequest } from '../middleware/auth';

function viewerOf(req: AuthRequest): ClientViewer {
  return { id: req.user!.id, role: req.user!.role };
}

export class ClientController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clients = await ClientService.getAll(
        {
          search: req.query.search as string,
          status: req.query.status as string,
          district: req.query.district as string,
        },
        viewerOf(req)
      );
      res.json({
        success: true,
        data: clients,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const client = await ClientService.getById(String(req.params.id), viewerOf(req));
      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const client = await ClientService.create({
        ...req.body,
        userId: req.user!.id,
      });
      res.status(201).json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const client = await ClientService.update(String(req.params.id), req.body, viewerOf(req));
      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ClientService.delete(String(req.params.id), viewerOf(req));
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
