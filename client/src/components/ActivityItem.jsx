import { motion } from 'framer-motion';

const TYPE_LABELS = {
  listen: 'listened to',
  collect: 'added to a collection',
  acquire: 'added to their collection',
  want: 'added to their wantlist',
  share: 'shared a collection',
  follow: 'started following',
};

export default function ActivityItem({ item }) {
  const label = TYPE_LABELS[item.type] ?? item.type;
  const meta = item.metadata ?? {};
  const title = meta.title ?? meta.name ?? '';

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="activity-item"
    >
      <span className="activity-avatar" aria-hidden="true">
        {(item.actor?.username ?? '?')[0].toUpperCase()}
      </span>
      <div className="activity-copy">
        <p>
          <strong>{item.actor?.username ?? 'Someone'}</strong> {label}
          {title && <span className="activity-title"> {title}</span>}
        </p>
        <time dateTime={item.createdAt}>
          {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </time>
      </div>
      {meta.artworkUrl && (
        <img src={meta.artworkUrl} alt="" className="activity-art" loading="lazy" />
      )}
    </motion.li>
  );
}
