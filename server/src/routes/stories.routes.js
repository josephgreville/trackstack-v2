import { z } from 'zod';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { albumIdParamSchema } from '../validators/schemas.js';
import {
  storyGet, storyUpsert, storyDelete, storiesIndex,
  photoAdd, photoDelete, publicStoriesForAlbum,
} from '../controllers/storiesController.js';

const storyIdParam = z.object({ storyId: z.string().uuid() });
const photoIdParam = z.object({ photoId: z.string().uuid() });

// Fields are optional and are NOT given a default: a partial update must
// leave the stored value alone rather than overwrite it with an empty string.
const storyUpsertBody = z.object({
  title: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
  location: z.string().max(200).optional(),
  occurredAt: z.string().date().optional(),
  isPublic: z.boolean().optional(),
});

const photoBody = z.object({
  url: z.string().url(),
  caption: z.string().max(300).optional(),
  takenAt: z.string().date().optional(),
  isCover: z.boolean().optional(),
});

const router = Router();
router.use(requireAuth);

router.get('/albums/:albumId/story', validate({ params: albumIdParamSchema }), asyncHandler(storyGet));
router.put('/albums/:albumId/story', validate({ params: albumIdParamSchema, body: storyUpsertBody }), asyncHandler(storyUpsert));
router.delete('/stories/:storyId', validate({ params: storyIdParam }), asyncHandler(storyDelete));
router.get('/stories', validate({ query: z.object({ publicOnly: z.string().optional() }) }), asyncHandler(storiesIndex));
router.post('/stories/:storyId/photos', validate({ params: storyIdParam, body: photoBody }), asyncHandler(photoAdd));
router.delete('/photos/:photoId', validate({ params: photoIdParam }), asyncHandler(photoDelete));
router.get(
  '/albums/:albumId/stories/public',
  validate({
    params: albumIdParamSchema,
    query: z.object({ limit: z.coerce.number().int().min(1).max(100).optional() }),
  }),
  asyncHandler(publicStoriesForAlbum),
);

export default router;
