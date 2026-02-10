import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { validate } from '../middleware/validate.middleware';
import {
  searchSchema,
  suggestionsSchema,
} from '../validations/search.validation';

const router = Router();

router.get(
  '/suggestions',
  validate(suggestionsSchema),
  searchController.suggestions,
);
router.get('/', validate(searchSchema), searchController.search);

export default router;
