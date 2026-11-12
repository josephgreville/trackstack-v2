import { z } from 'zod';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  follow, unfollow, followers, following, followStatus,
  activityFeed, globalActivity,
  notificationsIndex, notificationRead, notificationsReadAll, notificationCount,
  like, unlike, likeStatus, commentCreate, commentsIndex,
} from '../controllers/socialController.js';

const userIdParam = z.object({ userId: z.string().uuid() });
const notificationIdParam = z.object({ notificationId: z.string().uuid() });
const targetParams = z.object({
  targetType: z.string().refine((v) => ['collection', 'album'].includes(v), { message: 'Invalid target type.' }),
  targetId: z.string().min(1).max(64),
});
const paginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const router = Router();
router.use(requireAuth);

// Follows
router.post('/follow/:userId', validate({ params: userIdParam }), asyncHandler(follow));
router.delete('/follow/:userId', validate({ params: userIdParam }), asyncHandler(unfollow));
router.get('/followers/:userId', validate({ params: userIdParam }), asyncHandler(followers));
router.get('/following/:userId', validate({ params: userIdParam }), asyncHandler(following));
router.get('/follow-status/:userId', validate({ params: userIdParam }), asyncHandler(followStatus));

// Activity feed
router.get('/activity', validate({ query: paginationQuery }), asyncHandler(activityFeed));
router.get('/activity/global', validate({ query: paginationQuery }), asyncHandler(globalActivity));

// Notifications
router.get('/notifications', validate({ query: z.object({ unread: z.string().optional() }) }), asyncHandler(notificationsIndex));
router.get('/notifications/count', asyncHandler(notificationCount));
router.patch('/notifications/:notificationId/read', validate({ params: notificationIdParam }), asyncHandler(notificationRead));
router.patch('/notifications/read-all', asyncHandler(notificationsReadAll));

// Likes
router.post('/like/:targetType/:targetId', validate({ params: targetParams }), asyncHandler(like));
router.delete('/like/:targetType/:targetId', validate({ params: targetParams }), asyncHandler(unlike));
router.get('/like/:targetType/:targetId', validate({ params: targetParams }), asyncHandler(likeStatus));

// Comments
router.post(
  '/comments/:targetType/:targetId',
  validate({ params: targetParams, body: z.object({ body: z.string().min(1).max(1000) }) }),
  asyncHandler(commentCreate),
);
router.get(
  '/comments/:targetType/:targetId',
  validate({ params: targetParams, query: paginationQuery }),
  asyncHandler(commentsIndex),
);

export default router;
