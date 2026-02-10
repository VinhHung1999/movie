import { Router } from 'express';
import { genreController } from '../controllers/genre.controller';

const router = Router();

router.get('/', genreController.list);

export default router;
