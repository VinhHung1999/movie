import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { adminController } from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard stats
router.get('/stats', adminController.getStats);

// Content CRUD
router.get('/content', adminController.listContent);
router.post('/content', adminController.createContent);
router.put('/content/:id', adminController.updateContent);
router.delete('/content/:id', adminController.deleteContent);

// User management
router.get('/users', adminController.listUsers);

// Cast list (for content form dropdown)
router.get('/cast', adminController.listCast);

export default router;
