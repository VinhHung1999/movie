import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { watchHistoryController } from '../controllers/watch-history.controller';

const router = Router();

// All watch-history routes require authentication
router.use(authenticate);

// POST /api/watch-history - Save/update watch progress
router.post('/', watchHistoryController.saveProgress);

// GET /api/watch-history/continue - Get "Continue Watching" list
// NOTE: This must come BEFORE /:contentId to avoid matching "continue" as a contentId
router.get('/continue', watchHistoryController.getContinueWatching);

// GET /api/watch-history/:contentId - Get progress for specific content
router.get('/:contentId', watchHistoryController.getProgress);

export default router;
