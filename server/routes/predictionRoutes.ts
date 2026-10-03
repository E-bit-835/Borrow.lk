import { Router } from 'express';
import { PredictionController } from '../controllers/predictionController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, PredictionController.execute);
router.post('/gemini-ai', requireAuth, PredictionController.runGeminiAi);
router.post('/open-source-ai', requireAuth, PredictionController.runOpenSourceAi);
router.post('/custom-ml', requireAuth, PredictionController.runCustomMl);
router.get('/', requireAuth, PredictionController.getAll);
router.get('/:id', requireAuth, PredictionController.getById);

export default router;
