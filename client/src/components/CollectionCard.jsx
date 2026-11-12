import { formatAddedDate } from '../utils/format';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { hoverCard, listItem } from './motion.jsx';
import { IconDisc } from './Icons.jsx';

export default function CollectionCard({ collection, index }) {
  return (
    <motion.article
      variants={listItem}
      initial="hidden"
      animate="show"
      style={{ transition: { delay: index ? index * 0.04 : 0 } }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="collection-card group"
    >
      <Link
        to={`/collections/${collection.id}`}
        aria-label={`View ${collection.name} collection`}
        className="collection-card-link"
      >
        <div className="collection-card-cover" aria-hidden="true">
          {collection.coverArtworks?.[0]
            ? <img src={collection.coverArtworks[0]} alt="" className="w-full h-full object-cover" />
            : <div className="collection-card-empty-cover">
                <span className="collection-card-record"><IconDisc size={30} /></span>
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
    </motion.article>
  );
}
