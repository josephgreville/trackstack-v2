import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collectionsService, wantlistService } from '../services/index.js';
import { useToast } from '../context/ToastContext.jsx';
import { listItem } from './motion.jsx';

/**
 * A discovery card with one-click actions to add the album to a collection
 * or to the wantlist, and a dismiss control.
 */
export default function RecommendationCard({ recommendation, index = 0, onDismiss }) {
  const { album, reason, kind } = recommendation;
  const { success, error, info } = useToast();
  const [collections, setCollections] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const openPicker = async () => {
    if (collections) {
      setPickerOpen((open) => !open);
      return;
    }
    setBusy(true);
    try {
      const { collections: owned } = await collectionsService.list();
      setCollections(owned ?? []);
      setPickerOpen(true);
    } catch (err) {
      error(err.message ?? 'Could not load your collections.');
    } finally {
      setBusy(false);
    }
  };

  const addToCollection = async (collection) => {
    setBusy(true);
    try {
      await collectionsService.addAlbum(collection.id, { externalId: album.externalId });
      setAdded(true);
      setPickerOpen(false);
      success(`Added to ${collection.name}.`);
    } catch (err) {
      error(err.message ?? 'Could not add this album.');
    } finally {
      setBusy(false);
    }
  };

  const addToWantlist = async () => {
    setBusy(true);
    try {
      await wantlistService.add({ externalId: album.externalId });
      success('Added to your wantlist.');
    } catch (err) {
      error(err.message ?? 'Could not add to your wantlist.');
    } finally {
      setBusy(false);
    }
  };

  const dismiss = async () => {
    try {
      await onDismiss?.(recommendation);
    } catch (err) {
      info('Could not hide that recommendation.');
    }
  };

  return (
    <motion.article
      variants={listItem}
      initial="hidden"
      animate="show"
      className="recommendation-card"
    >
      <Link to={`/album/catalog/${album.externalId}`} className="recommendation-art">
        <img src={album.artworkUrl || ''} alt={`${album.title} cover`} loading="lazy" />
        <span className={`recommendation-kind recommendation-kind-${kind}`}>
          {kind === 'new_to_you' ? 'New to you' : kind === 'hidden_gem' ? 'Hidden gem' : 'For you'}
        </span>
      </Link>
      <div className="recommendation-copy">
        <h3 className="line-clamp-2">{album.title}</h3>
        <p className="recommendation-artist">{album.artist}</p>
        {reason && <p className="recommendation-reason">{reason}</p>}
        <div className="recommendation-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={openPicker} disabled={busy || added}>
            {added ? 'Added' : 'Add to collection'}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={addToWantlist} disabled={busy}>
            Wantlist
          </button>
          <button type="button" className="recommendation-dismiss" onClick={dismiss} aria-label="Hide this recommendation">
            ✕
          </button>
        </div>
        {pickerOpen && (
          <div className="recommendation-picker">
            {collections?.length ? collections.map((collection) => (
              <button key={collection.id} type="button" className="btn btn-outline btn-sm" onClick={() => addToCollection(collection)}>
                {collection.name}
              </button>
            )) : <p className="text-sm text-brown">Create a collection first.</p>}
          </div>
        )}
      </div>
    </motion.article>
  );
}
