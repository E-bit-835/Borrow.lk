import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { AuthRequest } from '../middleware/auth';
import { CapabilityService } from '../services/capabilityService';
import { categoryByName, listingTypeFor } from '../utils/categories';
import { query } from '../config/db';
import { SubscriptionService } from '../services/subscriptionService';

export class ProductController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getAll({
        category: req.query.category as string,
        district: req.query.district as string,
        search: req.query.search as string,
        clothingTypeId: req.query.clothingTypeId as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        providerId: req.query.providerId as string,
        listingType: req.query.listingType as string,
        subcategory: req.query.subcategory as string,
        availableOnly: req.query.availableOnly === 'true',
      });
      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getById(String(req.params.id));
      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Services are published by an approved PROVIDER, every other category by an approved HOST
      const category = categoryByName(req.body.category)!;
      const listingType = listingTypeFor(category.slug);
      await CapabilityService.assertCapability(req.user!.id, listingType === 'service' ? 'PROVIDER' : 'HOST');

      // Provider-side packages: the host's plan sets how many listings they can have
      if (req.user!.role !== 'admin') {
        await SubscriptionService.assertCanPublish(req.user!.id);
      }

      const product = await ProductService.create({
        ...req.body,
        category: category.name,
        categorySlug: category.slug,
        listingType,
        providerId: req.user?.id,
      });
      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /** Is the listing free for these dates? Used by "Check Availability" before a request is sent. */
  static async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.checkAvailability(
        String(req.params.id),
        String(req.query.startDate || ''),
        String(req.query.endDate || '')
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /** Report a listing to the admins. */
  static async report(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getById(String(req.params.id));
      await query(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, 'report_listing', 'product', $2, $3)`,
        [req.user!.id, product.id, JSON.stringify({ reason: req.body.reason, title: product.title })]
      );
      res.status(201).json({ success: true, data: { reported: true } });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await ProductService.getCategories();
      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getClothingTypes(_req: Request, res: Response, next: NextFunction) {
    try {
      const types = await ProductService.getClothingTypes();
      res.json({
        success: true,
        data: types,
      });
    } catch (error) {
      next(error);
    }
  }
}
