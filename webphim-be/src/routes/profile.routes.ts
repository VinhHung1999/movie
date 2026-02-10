import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { profileController } from '../controllers/profile.controller';

const router = Router();

router.use(authenticate);

router.get('/', profileController.getAll);
router.post('/', profileController.create);
router.put('/:profileId', profileController.update);
router.delete('/:profileId', profileController.remove);

export default router;
