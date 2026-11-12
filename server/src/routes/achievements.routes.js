import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  me, updateProfile, achievementsIndex, achievementsCheck,
} from '../controllers/achievementsController.js';
import { profileUpdateSchema, collectorProfileUpdateSchema } from '../validators/schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/me', asyncHandler(me));
router.patch('/profile', validate({ body: collectorProfileUpdateSchema }), asyncHandler(updateProfile));
router.get('/achievements', asyncHandler(achievementsIndex));
router.post('/achievements/check', asyncHandler(achievementsCheck));

export default router;
