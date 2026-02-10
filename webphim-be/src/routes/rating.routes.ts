import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { ratingController } from '../controllers/rating.controller';

const router = Router();

router.use(authenticate);

router.get('/', ratingController.getAll);
router.post('/:contentId', ratingController.rate);
router.delete('/:contentId', ratingController.remove);
router.get('/:contentId', ratingController.get);

export default router;
