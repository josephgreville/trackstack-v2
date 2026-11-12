import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { listContainer, listItem } from './motion.jsx';

export const SHELF_THEMES = {
  classic: { label: 'Classic Oak', wood: '#3a2a1e', highlight: '#5c4433' },
  charcoal: { label: 'Charcoal', wood: '#232323', highlight: '#3a3a3a' },
  coral: { label: 'Coral', wood: '#482a22', highlight: '#6d3d2e' },
  midnight: { label: 'Midnight', wood: '#1c2230', highlight: '#2c3547' },
  walnut: { label: 'Walnut', wood: '#33241a', highlight: '#52382a' },
};

export const SHELF_SORTS = [
  { key: 'added_at', label: 'Recently added' },
  { key: 'title', label: 'Title' },
  { key: 'artist', label: 'Artist' },
  { key: 'release_year', label: 'Year' },
  { key: 'genre', label: 'Genre' },
];

/**
 * Renders a collection as a virtual record shelf. Albums stand upright on a
 * wooden shelf plank; the plank colour comes from the collection's theme.
 */
export default function ShelfRoom({
  collection,
  albums = [],
  sort = 'added_at',
  theme = 'classic',
  onSortChange,
  onThemeChange,
  perShelf = 12,
}) {
  const palette = SHELF_THEMES[theme] ?? SHELF_THEMES.classic;
  const shelves = [];
  for (let i = 0; i < albums.length; i += perShelf) {
    shelves.push(albums.slice(i, i + perShelf));
  }

  return (
    <div className="shelf-room" style={{ '--shelf-wood': palette.wood, '--shelf-highlight': palette.highlight }}>
      <div className="shelf-toolbar">
        <label>
          Sort shelves by
          <select value={sort} onChange={(event) => onSortChange?.(event.target.value)}>
            {SHELF_SORTS.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          Shelf theme
          <select value={theme} onChange={(event) => onThemeChange?.(event.target.value)}>
            {Object.entries(SHELF_THEMES).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </label>
      </div>

      {!albums.length ? (
        <div className="shelf-empty">
          <p>This shelf is empty. Add albums to see them standing here.</p>
        </div>
      ) : (
        shelves.map((shelf, shelfIndex) => (
          <div className="shelf" key={`${collection?.id}-shelf-${shelfIndex}`}>
            <motion.div
              className="shelf-records"
              variants={listContainer}
              initial="hidden"
              animate="show"
            >
              {shelf.map((album, index) => (
                <motion.div
                  key={album.id ?? album.externalId}
                  variants={listItem}
                  className="shelf-record"
                  whileHover={{ y: -10, rotate: -1.5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  title={`${album.title} — ${album.artist}`}
                >
                  <Link
                    to={album.externalId ? `/album/catalog/${album.externalId}` : `/album/${album.id}`}
                    aria-label={`${album.title} by ${album.artist}`}
                  >
                    <img
                      src={album.artworkUrl || ''}
                      alt={`${album.title} cover`}
                      loading="lazy"
                      style={{ '--spine-hue': (index * 37) % 360 }}
                    />
                    <span className="shelf-spine" aria-hidden="true">
                      {album.title}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
            <div className="shelf-plank" aria-hidden="true">
              <span className="shelf-plank-line" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
