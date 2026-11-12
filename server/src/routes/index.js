import { Router } from 'express';
import authRoutes from './auth.routes.js';
import catalogRoutes from './catalog.routes.js';
import collectionRoutes from './collections.routes.js';
import albumRoutes from './albums.routes.js';
import personalFeatureRoutes from './personalFeatures.routes.js';
import publicRoutes from './public.routes.js';
import achievementsRoutes from './achievements.routes.js';
import socialRoutes from './social.routes.js';
import storiesRoutes from './stories.routes.js';
import recommendationsRoutes from './recommendations.routes.js';
import wrappedRoutes from './wrapped.routes.js';
import { pool } from '../db/pool.js';

const router = Router();

router.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', service: 'trackstack-api' });
});

router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
router.use('/collections', collectionRoutes);
router.use('/albums', albumRoutes);
router.use('/me', personalFeatureRoutes);
router.use('/public', publicRoutes);
router.use('/2', achievementsRoutes);       // gamification + profile (XP, achievements)
router.use('/2/social', socialRoutes);      // follows, activity, notifications, likes, comments
router.use('/2/stories', storiesRoutes);    // album stories + photos
router.use('/2/recommendations', recommendationsRoutes); // discover weekly
router.use('/2/wrapped', wrappedRoutes);    // yearly/monthly recap

export default router;
