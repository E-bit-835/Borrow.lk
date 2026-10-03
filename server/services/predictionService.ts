import { query } from '../config/db';
import { OpenSourceAiService, OpenSourceAiInput } from './openSourceAiService';
import { CustomMlService, CustomMlInput } from './customMlService';
import { GeminiAiService, GeminiAiInput } from './geminiAiService';

export type PredictionMethod = 'OPEN_SOURCE_AI' | 'CUSTOM_ML' | 'GEMINI_AI';

export interface ExecutePredictionDTO {
  userId?: string;
  clientId?: string;
  productId?: string;
  orderId?: string;
  predictionMethod: PredictionMethod;
  inputData: OpenSourceAiInput | CustomMlInput | GeminiAiInput | Record<string, any>;
  inputImageUrl?: string;
}

export class PredictionService {
  /**
   * Execute prediction with specified method (Google Gemini AI, Open Source AI, or Custom ML) and persist result to NeonDB
   */
  static async execute(dto: ExecutePredictionDTO) {
    let executionResult: {
      result: any;
      confidenceScore: number;
      modelName: string;
      modelVersion: string;
    };

    if (dto.predictionMethod === 'GEMINI_AI') {
      executionResult = await GeminiAiService.runPrediction(dto.inputData as GeminiAiInput);
    } else if (dto.predictionMethod === 'CUSTOM_ML') {
      executionResult = await CustomMlService.runPrediction(dto.inputData as CustomMlInput);
    } else {
      // Default to OPEN_SOURCE_AI
      executionResult = await OpenSourceAiService.runPrediction(dto.inputData as OpenSourceAiInput);
    }

    // Persist to NeonDB
    const res = await query(
      `INSERT INTO predictions (
         user_id, client_id, product_id, prediction_method,
         model_name, model_version, input_data, input_image_url,
         prediction_result, confidence_score, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        dto.userId || null,
        dto.clientId || null,
        dto.productId || null,
        dto.predictionMethod,
        executionResult.modelName,
        executionResult.modelVersion,
        JSON.stringify(dto.inputData),
        dto.inputImageUrl || null,
        JSON.stringify(executionResult.result),
        executionResult.confidenceScore,
        'completed',
      ]
    );

    const saved = res.rows[0];
    return {
      id: saved.id,
      predictionMethod: saved.prediction_method,
      modelName: saved.model_name,
      modelVersion: saved.model_version,
      inputData: typeof saved.input_data === 'string' ? JSON.parse(saved.input_data) : saved.input_data,
      inputImageUrl: saved.input_image_url,
      predictionResult: typeof saved.prediction_result === 'string' ? JSON.parse(saved.prediction_result) : saved.prediction_result,
      confidenceScore: parseFloat(saved.confidence_score),
      status: saved.status,
      createdAt: saved.created_at,
    };
  }

  static async getAll(filters: {
    userId?: string;
    clientId?: string;
    predictionMethod?: string;
    limit?: number;
  }) {
    let sql = `
      SELECT p.*, c.name AS client_name, prod.title AS product_title
      FROM predictions p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN products prod ON p.product_id = prod.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (filters.userId) {
      sql += ` AND p.user_id = $${idx}`;
      params.push(filters.userId);
      idx++;
    }

    if (filters.clientId) {
      sql += ` AND p.client_id = $${idx}`;
      params.push(filters.clientId);
      idx++;
    }

    if (filters.predictionMethod) {
      sql += ` AND p.prediction_method = $${idx}`;
      params.push(filters.predictionMethod);
      idx++;
    }

    sql += ` ORDER BY p.created_at DESC LIMIT $${idx}`;
    params.push(filters.limit || 50);

    const res = await query(sql, params);
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      clientId: r.client_id,
      clientName: r.client_name,
      productId: r.product_id,
      productTitle: r.product_title,
      predictionMethod: r.prediction_method,
      modelName: r.model_name,
      modelVersion: r.model_version,
      inputData: typeof r.input_data === 'string' ? JSON.parse(r.input_data) : r.input_data,
      inputImageUrl: r.input_image_url,
      predictionResult: typeof r.prediction_result === 'string' ? JSON.parse(r.prediction_result) : r.prediction_result,
      confidenceScore: parseFloat(r.confidence_score),
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  static async getById(id: string, viewer: { id: string; role: string }) {
    const res = await query(
      `SELECT p.*, c.name AS client_name, prod.title AS product_title
       FROM predictions p
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN products prod ON p.product_id = prod.id
       WHERE p.id = $1`,
      [id]
    );

    // Same response for a missing prediction and one owned by someone else, so IDs cannot be probed
    if (res.rows.length === 0 || (viewer.role !== 'admin' && res.rows[0].user_id !== viewer.id)) {
      const error: any = new Error('Prediction not found.');
      error.code = 'PREDICTION_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      clientId: r.client_id,
      clientName: r.client_name,
      productId: r.product_id,
      productTitle: r.product_title,
      predictionMethod: r.prediction_method,
      modelName: r.model_name,
      modelVersion: r.model_version,
      inputData: typeof r.input_data === 'string' ? JSON.parse(r.input_data) : r.input_data,
      inputImageUrl: r.input_image_url,
      predictionResult: typeof r.prediction_result === 'string' ? JSON.parse(r.prediction_result) : r.prediction_result,
      confidenceScore: parseFloat(r.confidence_score),
      status: r.status,
      createdAt: r.created_at,
    };
  }
}
