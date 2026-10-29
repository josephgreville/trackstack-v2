import { Router } from 'express';
import authRoutes from './auth.routes.js';
import catalogRoutes from './catalog.routes.js';
import collectionRoutes from './collections.routes.js';
import albumRoutes from './albums.routes.js';
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

export default router;
