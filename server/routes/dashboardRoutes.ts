import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { requireAuth, requireRole, requireCapability } from '../middleware/auth';

const router = Router();

// Every account is a renter, so the customer dashboard only needs a session
router.get('/customer', requireAuth, DashboardController.getCustomerDashboard);
router.get('/provider', requireAuth, requireCapability('HOST', 'PROVIDER'), DashboardController.getProviderDashboard);
router.get('/admin', requireAuth, requireRole('admin'), DashboardController.getAdminDashboard);

export default router;
