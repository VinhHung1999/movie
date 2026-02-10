import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { watchlistController } from '../controllers/watchlist.controller';

const router = Router();

router.use(authenticate);

router.get('/check/:contentId', watchlistController.check);
router.get('/', watchlistController.getAll);
router.post('/:contentId', watchlistController.add);
router.delete('/:contentId', watchlistController.remove);

export default router;
