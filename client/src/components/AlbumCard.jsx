import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatYear } from '../utils/format';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { wantlistService } from '../services/index.js';
import { hoverCard, hoverImage, listItem } from './motion.jsx';

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
  const artwork = album.artworkUrl ?? 'https://via.placeholder.com/300x300/dddde4/786b60';
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
          <img
            src={artwork}
            alt={`${album.title} artwork`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {user && album.externalId && (
            <button
              type="button"
              className="absolute top-3 right-3 z-10 catalog-wantlist-button"
              onClick={addToWantlist}
              aria-label={`Add ${album.title} to wantlist`}
            >
              ＋ Wantlist
            </button>
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
      </Link>
    </motion.article>
  );
}
