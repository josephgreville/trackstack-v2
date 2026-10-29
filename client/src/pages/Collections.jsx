import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { collectionsService } from '../services/index';
import CollectionCard from '../components/CollectionCard.jsx';
import Button from '../components/Button.jsx';

export default function Collections() {
  const { success, error } = useToast();

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    collectionsService
      .list()
      .then((data) => setCollections(data.collections))
      .catch((err) => {
        error(err.message ?? 'Failed to load collections.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { collection } = await collectionsService.create({ name, description });
      setCollections((current) => [collection, ...current]);
      setName('');
      setDescription('');
      setCreating(false);
      success('Collection created.');
    } catch (createError) {
      error(createError.message ?? 'Could not create collection.');
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (collection) => {
    setEditingId(collection.id);
    setEditName(collection.name);
    setEditDescription(collection.description ?? '');
  };

  const handleUpdate = async (event, id) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { collection } = await collectionsService.update(id, {
        name: editName,
        description: editDescription,
      });
      setCollections((current) => current.map((item) => item.id === id ? collection : item));
      setEditingId(null);
      success('Collection updated.');
    } catch (updateError) {
      error(updateError.message ?? 'Could not update collection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (collection) => {
    if (!window.confirm(`Delete "${collection.name}" and its album list?`)) return;
    setDeletingId(collection.id);
    try {
      await collectionsService.remove(collection.id);
      setCollections((current) => current.filter((item) => item.id !== collection.id));
      success('Collection deleted.');
    } catch (deleteError) {
      error(deleteError.message ?? 'Could not delete collection.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <section className="py-12">
        <div className="container-narrow">
          <p>Loading your collections…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container-narrow">
        <header className="mb-12">
          <h1 className="text-3xl font-display font-700 tracking-tighter mb-4">
            My collections
          </h1>
          <p className="text-lg text-brown max-w-2xl">
            Organise your albums into collections and keep track of what you love.
          </p>
          <Button className="mt-5" onClick={() => setCreating((current) => !current)}>
            {creating ? 'Cancel' : 'Create collection'}
          </Button>
        </header>

        {creating && (
          <form onSubmit={handleCreate} className="bg-paper rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-display font-600 mb-4">Create a collection</h2>
            <div className="mb-4">
              <label htmlFor="collection-name" className="block text-sm text-brown mb-2">Name</label>
              <input
                id="collection-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                required
                className="w-full rounded border line p-3"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="collection-description" className="block text-sm text-brown mb-2">Description (optional)</label>
              <textarea
                id="collection-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                className="w-full rounded border line p-3"
              />
            </div>
            <Button type="submit" loading={saving}>Save collection</Button>
          </form>
        )}

        <div className="grid grid-cols-1 gap-6">
          {collections.map((collection) => editingId === collection.id ? (
            <form
              key={collection.id}
              onSubmit={(event) => handleUpdate(event, collection.id)}
              className="bg-paper rounded-lg p-6 shadow-sm"
            >
              <h2 className="text-xl font-display font-600 mb-4">Edit {collection.name}</h2>
              <label htmlFor={`edit-name-${collection.id}`} className="block text-sm text-brown mb-2">Name</label>
              <input
                id={`edit-name-${collection.id}`}
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={80}
                required
                className="w-full rounded border line p-3 mb-4"
              />
              <label htmlFor={`edit-description-${collection.id}`} className="block text-sm text-brown mb-2">Description</label>
              <textarea
                id={`edit-description-${collection.id}`}
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                maxLength={500}
                className="w-full rounded border line p-3 mb-4"
              />
              <div className="flex gap-3">
                <Button type="submit" loading={saving}>Save changes</Button>
                <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div key={collection.id} className="bg-paper rounded-lg p-4 shadow-sm">
              <CollectionCard collection={collection} />
              <div className="flex gap-3 mt-4">
                <Button type="button" variant="outline" onClick={() => beginEdit(collection)}>Rename</Button>
                <Button
                  type="button"
                  variant="danger"
                  loading={deletingId === collection.id}
                  onClick={() => handleDelete(collection)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>

        {!collections.length && (
          <p className="text-brown text-sm text-muted mt-6">
            You don't have any collections yet. Create one to get started.
          </p>
        )}
      </div>
    </section>
  );
}