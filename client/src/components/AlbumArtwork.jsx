import { useEffect, useState } from 'react';
import { IconDisc } from './Icons.jsx';

export default function AlbumArtwork({
  src,
  title = 'Album',
  artist = '',
  className = '',
  eager = false,
  sizes = '(max-width: 640px) 50vw, 240px',
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`album-artwork album-artwork-fallback ${className}`.trim()} role="img" aria-label={`${title}${artist ? ` by ${artist}` : ''} — no artwork available`}>
        <span className="fallback-record" aria-hidden="true">
          <IconDisc size={44} />
        </span>
        <span className="fallback-title">{title}</span>
      </div>
    );
  }

  return (
    <img
      className={`album-artwork ${className}`.trim()}
      src={src}
      alt={`${title}${artist ? ` by ${artist}` : ''} album cover`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  );
}
