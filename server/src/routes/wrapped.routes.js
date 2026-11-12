import { z } from 'zod';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { index, recordSession } from '../controllers/wrappedController.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  validate({ query: z.object({ range: z.enum(['year', 'month', 'all']).optional().default('year') }) }),
  asyncHandler(index),
);

router.post(
  '/sessions',
  validate({
    body: z.object({
      albumId: z.string().uuid(),
      durationMs: z.coerce.number().int().min(0).max(86_400_000),
      completed: z.boolean().optional(),
    }),
  }),
  asyncHandler(recordSession),
);

export default router;
