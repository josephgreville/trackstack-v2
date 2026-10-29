import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { albumIdSchema, historyCreateSchema, historyIdParamsSchema, historyReviewSchema, wantlistCreateSchema, wantlistUpdateSchema } from '../validators/schemas.js';
import { historyCreate, historyIndex, historyUpdate, wantlistCreate, wantlistDelete, wantlistIndex, wantlistUpdate } from '../controllers/personalFeaturesController.js';

const router = Router();
router.use(requireAuth);
router.get('/wantlist', asyncHandler(wantlistIndex));
router.post('/wantlist', validate({ body: wantlistCreateSchema }), asyncHandler(wantlistCreate));
router.delete('/wantlist/:id', validate({ params: albumIdSchema }), asyncHandler(wantlistDelete));
router.patch('/wantlist/:id', validate({ params: albumIdSchema, body: wantlistUpdateSchema }), asyncHandler(wantlistUpdate));
router.get('/history', asyncHandler(historyIndex));
router.post('/history', validate({ body: historyCreateSchema }), asyncHandler(historyCreate));
router.patch('/history/:historyId', validate({ params: historyIdParamsSchema, body: historyReviewSchema }), asyncHandler(historyUpdate));
export default router;
