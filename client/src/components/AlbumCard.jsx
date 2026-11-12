import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatYear } from '../utils/format';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { wantlistService } from '../services/index.js';
import { hoverCard, hoverImage, listItem } from './motion.jsx';
import AlbumArtwork from './AlbumArtwork.jsx';

/**
 * A stable shelf reference for an album, in the style of a record shop
 * stock number. Built from the catalogue id so it never changes.
 */
export function catalogueRef(album) {
  const source = album.externalId ?? album.id ?? album.title ?? '';
  const digits = String(source).replace(/\D/g, '');
  const base = digits ? Number(digits) % 10000 : 0;
  const letters = String(album.artist ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'TS';
  return `TS-${String(base).padStart(4, '0')}${letters ? `/${letters}` : ''}`;
}

export default function AlbumCard({ album, index }) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const addToWantlist = async () => {
    try {
      await wantlistService.add({ externalId: album.externalId });
      success('Added to your wantlist.');
    } catch (err) {
      error(err.message ?? 'Could not add this album to your wantlist.');
    }
  };
  const subtitle = [album.artist, formatYear(album.releaseYear)].filter(Boolean).join(' · ');

  return (
    <motion.article
      key={album.id ?? album.externalId}
      variants={listItem}
      initial="hidden"
      animate="show"
      style={{ transition: { delay: index ? index * 0.04 : 0 } }}
      className="group bg-paper rounded-lg shadow-sm overflow-hidden border border-line hover:shadow-md transition-shadow"
    >
      <Link
        to={album.externalId ? `/album/catalog/${album.externalId}` : `/album/${album.id}`}
        aria-label={`View ${album.title} by ${album.artist}`}
        className="block"
      >
        <motion.div
          variants={hoverImage}
          className="relative w-full h-48 overflow-hidden"
        >
          <AlbumArtwork
            src={album.artworkUrl}
            title={album.title}
            artist={album.artist}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {user && album.externalId && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-3 right-3 z-10 wantlist-quick-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToWantlist();
              }}
              aria-label={`Add ${album.title} to wantlist`}
            >
              ＋
            </motion.button>
          )}
        </motion.div>
        <div className="p-4">
          <h3 className="font-display font-600 line-clamp-2 mb-2">{album.title}</h3>
          <p className="text-sm text-brown-line">{subtitle}</p>
          {album.trackCount && (
            <p className="text-xs text-brown-light mt-1">
              {album.trackCount} tracks
            </p>
          )}
        </div>
        {/* Stock label, the way a record shop marks a sleeve. */}
        <p className="catalogue-label">
          <span className="catalogue-number">{catalogueRef(album)}</span>
          <span className="catalogue-leader" aria-hidden="true" />
          <span className="catalogue-format">{album.releaseYear ?? '—'}</span>
        </p>
      </Link>
    </motion.article>
  );
}
