import { motion } from 'framer-motion';

/**
 * A shareable recap card. Purely presentational — the caller decides which
 * section to render and provides the data.
 */
export default function WrappedCard({
  title,
  subtitle,
  children,
  variant = 'default',
  shareLabel,
  onShare,
}) {
  return (
    <motion.section
      className={`wrapped-card wrapped-card-${variant}`}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      <header className="wrapped-card-header">
        <p className="eyebrow">TrackStack Wrapped</p>
        <h2>{title}</h2>
        {subtitle && <p className="wrapped-card-subtitle">{subtitle}</p>}
      </header>
      <div className="wrapped-card-body">{children}</div>
      {shareLabel && onShare && (
        <footer className="wrapped-card-footer">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="btn btn-primary btn-sm"
            onClick={onShare}
          >
            {shareLabel}
          </motion.button>
        </footer>
      )}
    </motion.section>
  );
}
