import { formatAddedDate } from '../utils/format';
import { Link } from 'react-router-dom';

export default function CollectionCard({ collection }) {
  return (
    <article className="collection-card group">
      <Link
        to={`/collections/${collection.id}`}
        aria-label={`View ${collection.name} collection`}
        className="collection-card-link"
      >
      <div className="collection-card-cover" aria-hidden="true">
        {collection.coverArtworks?.[0]
          ? <img src={collection.coverArtworks[0]} alt="" />
          : <div className="collection-card-empty-cover">
              <span className="collection-card-record">♫</span>
              <span className="collection-card-cover-label">
                {collection.albumCount ? 'Your collection' : 'Ready for its first album'}
              </span>
            </div>}
      </div>
      <div className="collection-card-copy">
        <h3>{collection.name}</h3>
        <p>{collection.albumCount} {collection.albumCount === 1 ? 'album' : 'albums'}</p>
        <p className="collection-card-date">Created {formatAddedDate(collection.createdAt)}</p>
      </div>
      </Link>
    </article>
  );
}
