import { Router } from 'express';
import { show } from '../controllers/albumsController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { albumIdSchema } from '../validators/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);
router.get('/:id', validate({ params: albumIdSchema }), asyncHandler(show));

export default router;
