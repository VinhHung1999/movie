import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadVideo } from '../config/multer';
import { videoController } from '../controllers/video.controller';

const router = Router();

// All video routes require authentication
router.use(authenticate);

// POST /api/videos/upload - Upload a video file
router.post('/upload', uploadVideo.single('video'), videoController.upload);

// GET /api/videos - List all videos (admin)
router.get('/', videoController.list);

// GET /api/videos/:id/status - Get transcode status
router.get('/:id/status', videoController.getStatus);

// GET /api/videos/:id/stream - Get stream URL
router.get('/:id/stream', videoController.getStream);

// POST /api/videos/:id/transcode - Trigger transcode
router.post('/:id/transcode', videoController.transcode);

export default router;
