import {
  followUser, unfollowUser, listFollowers, listFollowing, isFollowing,
  getActivityFeed, getGlobalActivity,
  listNotifications, markNotificationRead, markAllNotificationsRead,
  getUnreadNotificationCount, likeContent, unlikeContent, isLiked,
  addComment, listComments, getLikeCount,
} from '../services/socialService.js';

export async function follow(req, res) {
  const result = await followUser(req.user.id, req.validated.params.userId);
  res.status(201).json(result);
}

export async function unfollow(req, res) {
  const result = await unfollowUser(req.user.id, req.validated.params.userId);
  res.json(result);
}

export async function followers(req, res) {
  const list = await listFollowers(req.validated.params.userId);
  res.json({ followers: list });
}

export async function following(req, res) {
  const list = await listFollowing(req.validated.params.userId);
  res.json({ following: list });
}

export async function followStatus(req, res) {
  const following = await isFollowing(req.user.id, req.validated.params.userId);
  res.json({ following });
}

export async function activityFeed(req, res) {
  const feed = await getActivityFeed(req.user.id, {
    limit: Number(req.validated?.query?.limit ?? 20),
    offset: Number(req.validated?.query?.offset ?? 0),
  });
  res.json({ activity: feed });
}

export async function globalActivity(req, res) {
  const feed = await getGlobalActivity({
    limit: Number(req.validated?.query?.limit ?? 30),
    offset: Number(req.validated?.query?.offset ?? 0),
  });
  res.json({ activity: feed });
}

export async function notificationsIndex(req, res) {
  const notifications = await listNotifications(req.user.id, {
    unreadOnly: req.validated?.query?.unread === 'true',
  });
  res.json({ notifications });
}

export async function notificationRead(req, res) {
  const result = await markNotificationRead(req.user.id, req.validated.params.notificationId);
  res.json(result);
}

export async function notificationsReadAll(req, res) {
  const result = await markAllNotificationsRead(req.user.id);
  res.json(result);
}

export async function notificationCount(req, res) {
  const count = await getUnreadNotificationCount(req.user.id);
  res.json({ count });
}

export async function like(req, res) {
  const result = await likeContent(req.user.id, req.validated.params.targetType, req.validated.params.targetId);
  res.json(result);
}

export async function unlike(req, res) {
  const result = await unlikeContent(req.user.id, req.validated.params.targetType, req.validated.params.targetId);
  res.json(result);
}

export async function likeStatus(req, res) {
  const liked = await isLiked(req.user.id, req.validated.params.targetType, req.validated.params.targetId);
  const count = await getLikeCount(req.validated.params.targetType, req.validated.params.targetId);
  res.json({ liked, count });
}

export async function commentCreate(req, res) {
  const comment = await addComment(
    req.user.id,
    req.validated.params.targetType,
    req.validated.params.targetId,
    req.validated.body.body
  );
  res.status(201).json(comment);
}

export async function commentsIndex(req, res) {
  const comments = await listComments(req.validated.params.targetType, req.validated.params.targetId, {
    limit: Number(req.validated?.query?.limit ?? 20),
  });
  res.json({ comments });
}
