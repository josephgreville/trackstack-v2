import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { publicProfileParamsSchema, shareTokenParamsSchema } from '../validators/schemas.js';
import { getPublicProfile, getSharedCollection } from '../services/collectionsService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/share/:token', validate({ params: shareTokenParamsSchema }), asyncHandler(async (req, res) => {
  res.json({ collection: await getSharedCollection(req.validated.params.token) });
}));
router.get('/users/:username', validate({ params: publicProfileParamsSchema }), asyncHandler(async (req, res) => {
  res.json({ profile: await getPublicProfile(req.validated.params.username) });
}));
export default router;
