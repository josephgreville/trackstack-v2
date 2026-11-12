import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storiesService } from '../services/index.js';
import { useToast } from '../context/ToastContext.jsx';

/**
 * Lets a collector attach a personal memory to an album: where it came from,
 * who they were with, when it happened, and whether to publish it.
 */
export default function StoryEditor({ albumId, albumTitle }) {
  const [open, setOpen] = useState(false);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', location: '', occurredAt: '', isPublic: false });
  const { success, error } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { story: value } = await storiesService.getStory(albumId);
      setStory(value ?? null);
      if (value) {
        setForm({
          title: value.title ?? '',
          body: value.body ?? '',
          location: value.location ?? '',
          occurredAt: value.occurredAt ? String(value.occurredAt).slice(0, 10) : '',
          isPublic: Boolean(value.isPublic),
        });
      }
    } catch (err) {
      error(err.message ?? 'Could not load this story.');
    } finally {
      setLoading(false);
    }
  }, [albumId, error]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { story: value } = await storiesService.upsertStory(albumId, {
        title: form.title,
        body: form.body,
        location: form.location,
        occurredAt: form.occurredAt || undefined,
        isPublic: form.isPublic,
      });
      setStory(value);
      setOpen(false);
      success('Story saved.');
    } catch (err) {
      error(err.message ?? 'Could not save your story.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="story-editor">
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {story ? 'Edit story' : 'Add your story'}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            className="story-editor-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={save}
          >
            <h3>The story behind {albumTitle}</h3>
            {loading ? (
              <p role="status">Loading your story…</p>
            ) : (
              <>
                <label>
                  Title
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    maxLength={200}
                    placeholder="The one I always reach for"
                  />
                </label>
                <label>
                  Your memory
                  <textarea
                    value={form.body}
                    onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                    maxLength={5000}
                    rows={4}
                    placeholder="Why this record, why now, and what it reminds you of."
                  />
                </label>
                <div className="story-editor-row">
                  <label>
                    Where did you find it?
                    <input
                      value={form.location}
                      onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                      maxLength={200}
                      placeholder="A record shop in Soho"
                    />
                  </label>
                  <label>
                    When?
                    <input
                      type="date"
                      value={form.occurredAt}
                      onChange={(event) => setForm((current) => ({ ...current, occurredAt: event.target.value }))}
                    />
                  </label>
                </div>
                <label className="story-editor-public">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(event) => setForm((current) => ({ ...current, isPublic: event.target.checked }))}
                  />
                  Share this story on the album page
                </label>
                <div className="story-editor-actions">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? 'Saving…' : 'Save story'}
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </motion.form>
        )}
      </AnimatePresence>

      {story && !open && (
        <div className="story-editor-preview">
          {story.title && <strong>{story.title}</strong>}
          {story.body && <p>{story.body}</p>}
          {story.location && <small>Found at {story.location}</small>}
        </div>
      )}
    </section>
  );
}
