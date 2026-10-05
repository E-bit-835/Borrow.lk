import { Router } from 'express';
import authRoutes from './authRoutes';
import clientRoutes from './clientRoutes';
import productRoutes from './productRoutes';
import orderRoutes from './orderRoutes';
import predictionRoutes from './predictionRoutes';
import uploadRoutes from './uploadRoutes';
import dashboardRoutes from './dashboardRoutes';
import adminRoutes from './adminRoutes';
import hostRoutes from './hostRoutes';
import meRoutes from './meRoutes';
import aiRoutes from './aiRoutes';
import paymentRoutes from './paymentRoutes';
import { ProductController } from '../controllers/productController';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'BorrowLK API',
    database: 'NeonDB PostgreSQL',
  });
});

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/products', productRoutes);
router.get('/clothing-types', ProductController.getClothingTypes); // Alias of /products/clothing-types
router.use('/orders', orderRoutes);
router.use('/bookings', orderRoutes); // Aliased
router.use('/predictions', predictionRoutes);
router.use('/ai', aiRoutes); // Assistant chat: POST /api/ai/chat
router.use('/ai', predictionRoutes); // Aliased for /api/ai/open-source-ai
router.use('/ml', predictionRoutes); // Aliased for /api/ml/custom-ml
router.use('/uploads', uploadRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/host', hostRoutes);
router.use('/me', meRoutes);
router.use('/payments', paymentRoutes); // Card gateway callbacks

export default router;
