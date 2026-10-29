import { Link } from 'react-router-dom';
import { formatYear } from '../utils/format';

export default function AlbumCard({ album }) {
  const artwork = album.artworkUrl ?? 'https://via.placeholder.com/300x300/dddde4/786b60';
  const subtitle = [album.artist, formatYear(album.releaseYear)].filter(Boolean).join(' � ');

  return (
    <article className="group bg-paper rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link
        to={album.externalId ? `/album/catalog/${album.externalId}` : `/album/${album.id}`}
        aria-label={`View ${album.title} by ${album.artist}`}
        className="block"
      >
        <img src={artwork} alt={`${album.title} artwork`} className="w-full h-48 object-cover" />
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
    </article>
  );
}