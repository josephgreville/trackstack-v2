import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatYear, formatDuration } from '../utils/format';
import { albumsService, catalogService, collectionsService } from '../services/index';
import Button from '../components/Button.jsx';

export default function AlbumDetail() {
  const { externalId, albumId } = useParams();
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const { user } = useAuth();

  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [catalogueAvailable, setCatalogueAvailable] = useState(false);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [savingToCollection, setSavingToCollection] = useState(false);

  useEffect(() => {
    if (!externalId && !albumId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setAlbum(null);
    const request = albumId
      ? albumsService.saved(albumId)
      : catalogService.album(externalId);

    request
      .then((detail) => {
        setAlbum(detail.album);
        setTracks(detail.album.tracks ?? []);
        setRelated(detail.related ?? []);
        setCatalogueAvailable(detail.catalogueAvailable ?? false);
      })
      .catch((err) => {
        error(err.message ?? 'Could not load album details.');
      })
      .finally(() => setLoading(false));
  }, [albumId, error, externalId]);

  const openCollectionPicker = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/album/${albumId ?? `catalog/${externalId}`}` } });
      return;
    }

    setPickerLoading(true);
    try {
      const { collections: userCollections } = await collectionsService.list();
      setCollections(userCollections ?? []);
      setCollectionPickerOpen(true);
    } catch (err) {
      error(err.message ?? 'Could not load your collections.');
    } finally {
      setPickerLoading(false);
    }
  };

  const addToCollection = async (collection) => {
    const payload = album.externalId
      ? { externalId: album.externalId }
      : {
          manual: {
            title: album.title,
            artist: album.artist,
            releaseYear: album.releaseYear,
            genre: album.genre ?? '',
            artworkUrl: album.artworkUrl ?? '',
          },
        };
    setSavingToCollection(true);
    try {
      await collectionsService.addAlbum(collection.id, payload);
      success('Album added to collection.');
      setCollectionPickerOpen(false);
      navigate(`/collections/${collection.id}`);
    } catch (err) {
      error(err.message ?? 'Could not add this album to the collection.');
    } finally {
      setSavingToCollection(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12">
        <div className="container-narrow">
          <p>Loading album details…</p>
        </div>
      </section>
    );
  }

  if (!album) {
    return (
      <section className="py-12">
        <div className="container-narrow">
          <p>Album not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container-narrow">
        <div className="mb-8">
          <img
            src={album.artworkUrl || 'https://via.placeholder.com/600x600/dddde4/786b60?text=No+artwork'}
            alt={album.title}
            className="w-full h-64 rounded-lg object-cover mb-6"
          />
          <h1 className="text-3xl font-display font-700 mb-2">{album.title}</h1>
          <p className="text-brown">
            {album.artist} · {formatYear(album.releaseYear)} · {album.genre || 'Unknown genre'}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-display font-600 mb-4">Track listing</h2>
          {tracks.length > 0 ? (
            <ol className="list-decimal inside pl-6 space-y-2 text-sm">
              {tracks.map((track) => (
                <li key={track.externalId}>
                  {track.trackNumber?.toString().padStart(2, '0')}. {track.title}
                  {track.durationMs && (
                    <span className="text-brown-light ms-2">
                      {formatDuration(track.durationMs)}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-brown-light">No track listing available.</p>
          )}
        </div>

        {catalogueAvailable && (
          <div className="mt-8">
            <h2 className="text-xl font-display font-600 mb-4">Related albums</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {related.map((rel) => (
                <article
                  key={rel.externalId}
                  className="bg-paper rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <img
                    src={rel.artworkUrl || 'https://via.placeholder.com/150x150/dddde4/786b60'}
                    alt={rel.title}
                    className="w-full h-24 object-cover rounded mb-3"
                  />
                  <h3 className="font-display font-600 line-clamp-1">{rel.title}</h3>
                  <p className="text-xs text-brown-light">{rel.artist}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        <Button className="mt-6" loading={pickerLoading} onClick={openCollectionPicker}>
          Add to collection
        </Button>
        {collectionPickerOpen && (
          <section aria-labelledby="collection-picker-title" className="mt-6 bg-paper rounded-lg p-6">
            <h2 id="collection-picker-title" className="text-xl font-display font-600 mb-4">
              Choose a collection
            </h2>
            {collections.length ? (
              <div className="flex flex-wrap gap-3">
                {collections.map((collection) => (
                  <Button
                    key={collection.id}
                    loading={savingToCollection}
                    disabled={savingToCollection}
                    onClick={() => addToCollection(collection)}
                  >
                    Add to {collection.name}
                  </Button>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-brown mb-4">You don't have any collections yet. Create one first.</p>
                <Button to="/collections">Create a collection</Button>
              </div>
            )}
            <Button
              className="mt-4"
              variant="outline"
              disabled={savingToCollection}
              onClick={() => setCollectionPickerOpen(false)}
            >
              Cancel
            </Button>
          </section>
        )}
      </div>
    </section>
  );
}
