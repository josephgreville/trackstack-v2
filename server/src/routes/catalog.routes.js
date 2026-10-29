import { Router } from 'express';
import { albumDetail, featured, search } from '../controllers/catalogController.js';
import { catalogLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { catalogAlbumParamsSchema, searchQuerySchema } from '../validators/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(catalogLimiter);
router.get('/search', validate({ query: searchQuerySchema }), asyncHandler(search));
router.get('/featured', asyncHandler(featured));
router.get(
  '/albums/:externalId',
  validate({ params: catalogAlbumParamsSchema }),
  asyncHandler(albumDetail),
);

export default router;
