import { Router } from 'express';
import { z } from 'zod';
import { OrderController } from '../controllers/orderController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const dateString = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((value) => !Number.isNaN(Date.parse(value)), `${label} must be a valid date`);

// Rental days, provider and customer are derived server-side; unknown keys are stripped
const createOrderSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  startDate: dateString('Start date'),
  endDate: dateString('End date'),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
  clientId: z.string().optional(),
  predictionMethod: z.enum(['OPEN_SOURCE_AI', 'CUSTOM_ML', 'GEMINI_AI']).optional(),
  predictionId: z.string().optional(),
  predictionInputData: z.record(z.string(), z.any()).optional(),
  predictionImageUrl: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected']),
});

router.get('/', requireAuth, OrderController.getAll);
router.get('/:id', requireAuth, OrderController.getById);
router.post('/', requireAuth, validate(createOrderSchema), OrderController.create);
router.patch('/:id/status', requireAuth, validate(updateStatusSchema), OrderController.updateStatus);

export default router;
