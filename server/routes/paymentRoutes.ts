import { Router } from 'express';
import { SubscriptionService } from '../services/subscriptionService';

const router = Router();

// PayHere calls this from its own servers after a card payment; the signature is checked in the service
router.post('/payhere/notify', async (req, res, next) => {
  try {
    res.json({ success: true, data: await SubscriptionService.handlePayHereNotification(req.body || {}) });
  } catch (error) {
    next(error);
  }
});

export default router;
