import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';
import { uploadMiddleware } from '../middleware/upload';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, uploadMiddleware.single('file'), UploadController.uploadFile);
router.post('/multiple', requireAuth, uploadMiddleware.array('files', 10), UploadController.uploadMultiple);

export default router;
