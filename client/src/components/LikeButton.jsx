import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { socialService } from '../services/index.js';
import { IconHeart } from './Icons.jsx';

export default function LikeButton({ targetType, targetId, initialCount = 0, initialLiked = false }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  const toggle = async () => {
    if (busy) return;
    const next = !liked;
    setLiked(next);
    setCount((value) => value + (next ? 1 : -1));
    setBusy(true);
    try {
      if (next) await socialService.like(targetType, targetId);
      else await socialService.unlike(targetType, targetId);
    } catch {
      setLiked(!next);
      setCount((value) => value + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={toggle}
      disabled={busy}
      className={`like-button ${liked ? 'is-liked' : ''}`}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <span aria-hidden="true"><IconHeart size={17} filled={liked} /></span>
      {count > 0 && <span className="like-count">{count}</span>}
    </motion.button>
  );
}
