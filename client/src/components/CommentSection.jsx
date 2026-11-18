import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { socialService } from '../services/index.js';
import { useToast } from '../context/ToastContext.jsx';
import LikeButton from './LikeButton.jsx';

export default function CommentSection({ targetType, targetId }) {
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    socialService
      .comments(targetType, targetId)
      .then(({ comments: rows }) => setComments(rows ?? []))
      .catch((err) => error(err.message ?? 'Could not load comments.'))
      .finally(() => setLoading(false));
  }, [targetType, targetId, error]);

  useEffect(() => { load(); }, [load]);

  const post = async (text, parentId = null) => {
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await socialService.addComment(targetType, targetId, trimmed, parentId);
      success(parentId ? 'Reply added.' : 'Comment added.');
      if (parentId) {
        setReplyTo(null);
        setReplyText('');
      } else {
        setBody('');
      }
      load();
    } catch (err) {
      error(err.message ?? 'Could not add your comment.');
    } finally {
      setSaving(false);
    }
  };

  const submitComment = (event) => {
    event.preventDefault();
    post(body);
  };

  const submitReply = (event, parentId) => {
    event.preventDefault();
    post(replyText, parentId);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setReplyText('');
  };

  const roots = comments.filter((comment) => !comment.parentId);
  const repliesFor = (id) => comments.filter((comment) => comment.parentId === id);

  const renderActions = (comment, parentId) => (
    <div className="comment-actions">
      <LikeButton
        targetType="comment"
        targetId={comment.id}
        initialCount={comment.likeCount ?? 0}
        initialLiked={comment.liked ?? false}
      />
      <button
        type="button"
        className="comment-action"
        onClick={() => {
          setReplyTo(parentId);
          setReplyText('');
        }}
        aria-label={`Reply to ${comment.author?.username ?? 'this comment'}`}
      >
        Reply
      </button>
    </div>
  );

  const renderCopy = (comment, parentId, isReply) => (
    <div className="comment-copy">
      <strong>{comment.author?.username}</strong>
      {isReply && comment.replyTo?.username && (
        <span className="comment-reply-to">to {comment.replyTo.username}</span>
      )}
      <time dateTime={comment.createdAt}>
        {new Date(comment.createdAt).toLocaleDateString('en-GB')}
      </time>
      <p>{comment.body}</p>
      {renderActions(comment, parentId)}
    </div>
  );

  const avatar = (comment) => (
    <span className="comment-avatar" aria-hidden="true">
      {(comment.author?.username ?? '?')[0].toUpperCase()}
    </span>
  );

  return (
    <section className="comment-section" aria-label="Comments">
      <h3 className="comment-heading">Comments {comments.length > 0 && <span>({comments.length})</span>}</h3>

      <form className="comment-form" onSubmit={submitComment}>
        <label htmlFor={`comment-${targetType}-${targetId}`} className="sr-only">Add a comment</label>
        <textarea
          id={`comment-${targetType}-${targetId}`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Share what you think…"
          maxLength={1000}
          rows={2}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !body.trim()}>
          {saving ? 'Posting…' : 'Post'}
        </button>
      </form>

      {loading ? (
        <p role="status" className="comment-loading">Loading comments…</p>
      ) : roots.length === 0 ? (
        <p className="comment-empty">No comments yet. Be the first.</p>
      ) : (
        <ul className="comment-list">
          {roots.map((comment) => {
            const replies = repliesFor(comment.id);
            return (
              <motion.li
                key={comment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="comment-thread"
              >
                <div className="comment-item">
                  {avatar(comment)}
                  {renderCopy(comment, comment.id, false)}
                </div>
                {replies.length > 0 && (
                  <ul className="comment-replies">
                    {replies.map((reply) => (
                      <li key={reply.id} className="comment-item">
                        {avatar(reply)}
                        {renderCopy(reply, reply.parentId, true)}
                      </li>
                    ))}
                  </ul>
                )}
                {replyTo === comment.id && (
                  <form className="comment-reply-form" onSubmit={(event) => submitReply(event, comment.id)}>
                    <label htmlFor={`reply-${comment.id}`} className="sr-only">
                      Reply to {comment.author?.username ?? 'this comment'}
                    </label>
                    <textarea
                      id={`reply-${comment.id}`}
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder={`Reply to ${comment.author?.username ?? 'this comment'}…`}
                      maxLength={1000}
                      rows={2}
                    />
                    <div className="comment-reply-actions">
                      <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !replyText.trim()}>
                        {saving ? 'Posting…' : 'Post reply'}
                      </button>
                      <button type="button" className="comment-action" onClick={cancelReply}>Cancel</button>
                    </div>
                  </form>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
