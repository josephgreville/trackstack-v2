import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { socialService } from '../services/index.js';
import { useToast } from '../context/ToastContext.jsx';

export default function FollowButton({ userId, initialFollowing = false, size = 'sm', onChange }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const { success, error } = useToast();

  useEffect(() => setFollowing(initialFollowing), [initialFollowing]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (following) {
        await socialService.unfollow(userId);
        setFollowing(false);
        success('Unfollowed.');
      } else {
        await socialService.follow(userId);
        setFollowing(true);
        success('Following.');
      }
      onChange?.(!following);
    } catch (err) {
      error(err.message ?? 'Could not update follow.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={toggle}
      disabled={busy}
      className={`follow-button ${following ? 'is-following' : ''} follow-button-${size}`}
      aria-pressed={following}
    >
      {following ? 'Following' : 'Follow'}
    </motion.button>
  );
}
