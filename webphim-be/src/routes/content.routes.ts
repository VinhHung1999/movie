import { Router } from 'express';
import { contentController } from '../controllers/content.controller';
import { validate } from '../middleware/validate.middleware';
import { contentListSchema, contentDetailSchema, similarContentSchema } from '../validations/content.validation';

const router = Router();

// IMPORTANT: /featured BEFORE /:id to avoid "featured" matching as UUID param
router.get('/featured', contentController.getFeatured);
router.get('/:id/similar', validate(similarContentSchema), contentController.getSimilar);
router.get('/:id', validate(contentDetailSchema), contentController.getDetail);
router.get('/', validate(contentListSchema), contentController.list);

export default router;
