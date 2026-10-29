import { Router } from 'express';
import {
  addAlbum,
  create,
  destroy,
  index,
  removeAlbum,
  show,
  update,
} from '../controllers/collectionsController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addAlbumSchema,
  collectionAlbumsQuerySchema,
  collectionCreateSchema,
  collectionIdSchema,
  collectionUpdateSchema,
  removeAlbumSchema,
} from '../validators/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(index));
router.post('/', validate({ body: collectionCreateSchema }), asyncHandler(create));
router.get(
  '/:id',
  validate({ params: collectionIdSchema, query: collectionAlbumsQuerySchema }),
  asyncHandler(show),
);
router.patch(
  '/:id',
  validate({ params: collectionIdSchema, body: collectionUpdateSchema }),
  asyncHandler(update),
);
router.delete('/:id', validate({ params: collectionIdSchema }), asyncHandler(destroy));
router.post(
  '/:id/albums',
  validate({ params: collectionIdSchema, body: addAlbumSchema }),
  asyncHandler(addAlbum),
);
router.delete(
  '/:id/albums/:albumId',
  validate({ params: removeAlbumSchema }),
  asyncHandler(removeAlbum),
);

export default router;
