import { Router } from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import contentRoutes from './content.routes';
import genreRoutes from './genre.routes';
import profileRoutes from './profile.routes';
import ratingRoutes from './rating.routes';
import searchRoutes from './search.routes';
import videoRoutes from './video.routes';
import watchHistoryRoutes from './watch-history.routes';
import watchlistRoutes from './watchlist.routes';

const router = Router();

router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/content', contentRoutes);
router.use('/genres', genreRoutes);
router.use('/profiles', profileRoutes);
router.use('/ratings', ratingRoutes);
router.use('/search', searchRoutes);
router.use('/videos', videoRoutes);
router.use('/watch-history', watchHistoryRoutes);
router.use('/watchlist', watchlistRoutes);

export default router;
