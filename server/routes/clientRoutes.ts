import { Router } from 'express';
import { z } from 'zod';
import { ClientController } from '../controllers/clientController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const createClientSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(8, 'Valid phone number is required'),
  company: z.string().optional(),
  district: z.string().min(2, 'District is required'),
  city: z.string().min(2, 'City is required'),
  address: z.string().optional(),
  avatar: z.string().optional(),
  nicNumber: z.string().optional(),
  clientType: z.enum(['individual', 'corporate', 'agency']).optional(),
  notes: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'blocked']).optional(),
});

router.get('/', requireAuth, ClientController.getAll);
router.get('/:id', requireAuth, ClientController.getById);
router.post('/', requireAuth, validate(createClientSchema), ClientController.create);
router.put('/:id', requireAuth, validate(updateClientSchema), ClientController.update);
router.delete('/:id', requireAuth, ClientController.delete);

export default router;
