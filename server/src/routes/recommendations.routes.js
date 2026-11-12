import { z } from 'zod';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uuid } from '../validators/schemas.js';
import { index, dismiss, discoverWeekly } from '../controllers/recommendationsController.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  validate({
    query: z.object({
      kind: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(50).optional(),
    }),
  }),
  asyncHandler(index),
);
router.post('/discover-weekly', asyncHandler(discoverWeekly));
router.delete('/:id/dismiss', validate({ params: { id: uuid } }), asyncHandler(dismiss));

export default router;
