import { Router } from 'express';
import { z } from 'zod';
import { ProductController } from '../controllers/productController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CATEGORY_NAMES, PRICE_UNITS } from '../utils/categories';

const router = Router();

// The owning provider is taken from the session; unknown keys are stripped
const createProductSchema = z.object({
  // Listing type follows the category: Services are hired from providers, everything else is rented from hosts
  title: z.string().trim().min(1, 'Title is required').max(255),
  category: z.enum(CATEGORY_NAMES, 'Choose one of the BorrowLK categories'),
  subcategory: z.string().trim().max(100).optional(),
  priceUnit: z.enum(PRICE_UNITS).default('day'),
  province: z.string().trim().max(100).optional(),
  clothingTypeId: z.string().optional(),
  images: z.array(z.string()).max(10, 'A listing can have at most 10 images').optional(),
  pricePerDay: z.coerce.number().positive('Price per day must be greater than zero'),
  deposit: z.coerce.number().min(0, 'Deposit cannot be negative').optional(),
  location: z.string().trim().min(1, 'Location is required').max(255),
  district: z.string().trim().min(1, 'District is required').max(100),
  description: z.string(),
  specifications: z.record(z.string(), z.any()).optional(),
  includedItems: z.array(z.string()).optional(),
  rentalTerms: z.array(z.string()).optional(),
  featuredBadge: z.string().max(100).optional(),
});

const reportSchema = z.object({
  reason: z.string().trim().min(5, 'Please describe the problem').max(1000),
});

router.get('/', ProductController.getAll);
router.get('/categories', ProductController.getCategories);
router.get('/clothing-types', ProductController.getClothingTypes);
router.get('/:id/availability', ProductController.getAvailability);
router.get('/:id', ProductController.getById);
router.post('/:id/report', requireAuth, validate(reportSchema), ProductController.report);
router.post('/', requireAuth, validate(createProductSchema), ProductController.create);

export default router;
