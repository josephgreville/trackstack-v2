import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { socialService } from '../services/index.js';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [recent, setRecent] = useState([]);

  const load = useCallback(() => {
    socialService.notificationCount()
      .then(({ count: value }) => setCount(value ?? 0))
      .catch(() => {});
    socialService.notifications({ unread: true })
      .then(({ notifications }) => setRecent(notifications ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <Link to="/notifications" className="notification-bell" aria-label={`Notifications${count ? `, ${count} unread` : ''}`}>
      <span aria-hidden="true">🔔</span>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="notification-badge"
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
      {recent.length > 0 && <span className="sr-only">{recent.length} unread notifications</span>}
    </Link>
  );
}
