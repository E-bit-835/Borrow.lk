import { Response, NextFunction } from 'express';
import { PredictionService } from '../services/predictionService';
import { AuthRequest } from '../middleware/auth';

export class PredictionController {
  /**
   * Run a prediction with either OPEN_SOURCE_AI or CUSTOM_ML and persist result in NeonDB
   */
  static async execute(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { predictionMethod, inputData, clientId, productId, inputImageUrl } = req.body;
      const prediction = await PredictionService.execute({
        userId: req.user?.id,
        clientId,
        productId,
        predictionMethod: predictionMethod || 'OPEN_SOURCE_AI',
        inputData: inputData || {},
        inputImageUrl,
      });

      res.status(201).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Run Open-Source AI intelligence directly
   */
  static async runOpenSourceAi(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prediction = await PredictionService.execute({
        userId: req.user?.id,
        clientId: req.body.clientId,
        productId: req.body.productId,
        predictionMethod: 'OPEN_SOURCE_AI',
        inputData: req.body,
        inputImageUrl: req.body.inputImageUrl,
      });

      res.json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Run Google Gemini AI assessment directly
   */
  static async runGeminiAi(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prediction = await PredictionService.execute({
        userId: req.user?.id,
        clientId: req.body.clientId,
        productId: req.body.productId,
        predictionMethod: 'GEMINI_AI',
        inputData: req.body,
        inputImageUrl: req.body.imageUrl || req.body.inputImageUrl,
      });

      res.json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Run Custom Machine Learning assessment directly
   */
  static async runCustomMl(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prediction = await PredictionService.execute({
        userId: req.user?.id,
        clientId: req.body.clientId,
        productId: req.body.productId,
        predictionMethod: 'CUSTOM_ML',
        inputData: req.body,
        inputImageUrl: req.body.imageUrl || req.body.inputImageUrl,
      });

      res.json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const predictions = await PredictionService.getAll({
        // Only admins may list another user's (or everyone's) predictions
        userId: req.user!.role === 'admin' ? (req.query.userId as string) : req.user!.id,
        clientId: req.query.clientId as string,
        predictionMethod: req.query.method as string,
      });
      res.json({
        success: true,
        data: predictions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prediction = await PredictionService.getById(String(req.params.id), {
        id: req.user!.id,
        role: req.user!.role,
      });
      res.json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  }
}
