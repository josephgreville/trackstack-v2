import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socialService } from '../services/index.js';
import Button from '../components/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  IconPeople, IconHeart, IconQuote, IconTarget, IconMedal,
} from '../components/Icons.jsx';

const NOTIFICATION_ICONS = {
  follow: IconPeople,
  like: IconHeart,
  comment: IconQuote,
  price_alert: IconTarget,
  achievement: IconMedal,
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { error, success } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    socialService.notifications({ unread: filter === 'unread' })
      .then(({ notifications: rows }) => setNotifications(rows ?? []))
      .catch((err) => error(err.message ?? 'Could not load your notifications.'))
      .finally(() => setLoading(false));
  }, [filter, error]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (notification) => {
    if (notification.read) return;
    try {
      await socialService.markNotificationRead(notification.id);
      setNotifications((rows) =>
        rows.map((row) => (row.id === notification.id ? { ...row, read: true } : row)));
    } catch (err) {
      error(err.message ?? 'Could not mark that notification as read.');
    }
  };

  const markAll = async () => {
    try {
      await socialService.markAllNotificationsRead();
      setNotifications((rows) => rows.map((row) => ({ ...row, read: true })));
      success('All notifications marked as read.');
    } catch (err) {
      error(err.message ?? 'Could not mark your notifications as read.');
    }
  };

  const unread = notifications.filter((notification) => !notification.read).length;

  return (
    <section className="page-section">
      <div className="container-narrow">
        <header className="page-heading">
          <p className="eyebrow">What is happening around you</p>
          <h1>Notifications</h1>
          <p>{unread ? `${unread} unread` : 'You are all caught up.'}</p>
        </header>

        <div className="notification-controls">
          <div className="range-switcher" role="tablist" aria-label="Notification filter">
            {[{ key: 'all', label: 'All' }, { key: 'unread', label: 'Unread' }].map((option) => (
              <motion.button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={filter === option.key}
                whileTap={{ scale: 0.96 }}
                className={`range-tab ${filter === option.key ? 'is-active' : ''}`}
                onClick={() => setFilter(option.key)}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
          {unread > 0 && <Button variant="outline" size="sm" onClick={markAll}>Mark all as read</Button>}
        </div>

        {loading ? (
          <p role="status">Loading notifications…</p>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <h2>No notifications</h2>
            <p>When someone follows you, likes a collection or comments, you will hear about it here.</p>
          </div>
        ) : (
          <ul className="notification-list">
            <AnimatePresence initial={false}>
              {notifications.map((notification) => (
                <motion.li
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`notification-item ${notification.read ? 'is-read' : 'is-unread'}`}
                >
                  <span className="notification-icon" aria-hidden="true">
                    {(() => {
                      const Icon = NOTIFICATION_ICONS[notification.type] ?? IconPeople;
                      return <Icon size={17} />;
                    })()}
                  </span>
                  <div className="notification-copy">
                    <p>{notification.message}</p>
                    <time dateTime={notification.createdAt}>
                      {new Date(notification.createdAt).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </time>
                  </div>
                  {!notification.read && (
                    <button
                      type="button"
                      className="notification-mark-read"
                      onClick={() => markRead(notification)}
                    >
                      Mark read
                    </button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );
}
