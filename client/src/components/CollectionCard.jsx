import { cx, formatAddedDate } from '../utils/format';

export default function CollectionCard({ collection }) {
  return (
    <article
      className="group bg-paper rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Cover artworks from the join table */}
      <div className="aspect-square rounded-t-lg">
        {collection.coverArtworks && collection.coverArtworks.length > 0
          ? <img
              src={collection.coverArtworks[0]}
              alt={collection.name}
              className="w-full h-48 object-cover"
            />
          : <img
              src="https://via.placeholder.com/300x300/dddde4/786b60"
              alt={collection.name}
              className="w-full h-48 object-cover"
            />
          }
      </div>
      <div className="p-4">
        <h3 className="font-display font-600 line-clamp-1">{collection.name}</h3>
        <p className="text-xs text-brown-line mt-1">{collection.albumCount} albums</p>
        <p className="text-xs text-brown-light mt-2">{formatAddedDate(collection.createdAt)}</p>
      </div>
    </article>
  );
}