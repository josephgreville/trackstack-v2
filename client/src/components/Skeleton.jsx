/* Animated skeleton placeholders for content that is loading.
 * Uses CSS @keyframes defined in styles/components.css (skeleton-pulse).
 */
export function Skeleton({ className = '', width = '100%', height = 16 }) {
  return (
    <span
      className={[
        'skeleton',
        'animate-pulse',
        className,
      ].filter(Boolean).join(' ')}
      style={{ width, height, display: 'inline-block' }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={['skeleton-text', className].filter(Boolean).join(' ')}>
      {Array.from({ length: lines }).map((_, i) => (
        <span
          key={i}
          className="skeleton"
          style={{
            width: i === lines - 1 ? '60%' : '100%',
            height: 14,
            display: 'block',
            marginBottom: i === lines - 1 ? 0 : 8,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function SkeletonAlbumCard({ className = '' }) {
  return (
    <article className={['bg-paper rounded-lg shadow-sm overflow-hidden border border-line', className].filter(Boolean).join(' ')}>
      <div className="skeleton" style={{ width: '100%', height: 180 }} aria-hidden="true" />
      <div className="p-4">
        <SkeletonText lines={2} />
      </div>
    </article>
  );
}
