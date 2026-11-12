import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { socialService } from '../services/index.js';
import { useToast } from '../context/ToastContext.jsx';

export default function CommentSection({ targetType, targetId }) {
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
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

  const submit = async (event) => {
    event.preventDefault();
    const text = body.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      await socialService.addComment(targetType, targetId, text);
      setBody('');
      success('Comment added.');
      load();
    } catch (err) {
      error(err.message ?? 'Could not add your comment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="comment-section" aria-label="Comments">
      <h3 className="comment-heading">Comments {comments.length > 0 && <span>({comments.length})</span>}</h3>

      <form className="comment-form" onSubmit={submit}>
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
      ) : comments.length === 0 ? (
        <p className="comment-empty">No comments yet. Be the first.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((comment) => (
            <motion.li
              key={comment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="comment-item"
            >
              <span className="comment-avatar" aria-hidden="true">
                {(comment.author?.username ?? '?')[0].toUpperCase()}
              </span>
              <div className="comment-copy">
                <strong>{comment.author?.username}</strong>
                <time dateTime={comment.createdAt}>
                  {new Date(comment.createdAt).toLocaleDateString('en-GB')}
                </time>
                <p>{comment.body}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
