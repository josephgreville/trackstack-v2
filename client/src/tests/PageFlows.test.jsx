import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext.jsx';
import Home from '../pages/Home.jsx';
import Browse from '../pages/Browse.jsx';
import AlbumDetail from '../pages/AlbumDetail.jsx';
import Collections from '../pages/Collections.jsx';
import CollectionDetail from '../pages/CollectionDetail.jsx';
import AddAlbum from '../pages/add-album/AddAlbum.jsx';
import AppLayout from '../layout/AppLayout.jsx';
import Community from '../pages/Community.jsx';
import NotFound from '../pages/NotFound.jsx';

const mocks = vi.hoisted(() => ({
  user: { id: 'user-1', username: 'listener' },
  albumsRecent: vi.fn(),
  catalogFeatured: vi.fn(),
  catalogSearch: vi.fn(),
  catalogAlbum: vi.fn(),
  albumsSaved: vi.fn(),
  collectionsList: vi.fn(),
  collectionsCreate: vi.fn(),
  collectionsGet: vi.fn(),
  collectionsUpdate: vi.fn(),
  collectionsRemove: vi.fn(),
  collectionsRemoveAlbum: vi.fn(),
  collectionsAddAlbum: vi.fn(),
}));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mocks.user, isLoading: false, logout: vi.fn() }),
}));

vi.mock('../services/index.js', () => ({
  albumsService: { recent: mocks.albumsRecent, saved: mocks.albumsSaved },
  catalogService: {
    featured: mocks.catalogFeatured,
    search: mocks.catalogSearch,
    album: mocks.catalogAlbum,
  },
  collectionsService: {
    list: mocks.collectionsList,
    create: mocks.collectionsCreate,
    get: mocks.collectionsGet,
    update: mocks.collectionsUpdate,
    remove: mocks.collectionsRemove,
    removeAlbum: mocks.collectionsRemoveAlbum,
    addAlbum: mocks.collectionsAddAlbum,
  },
}));

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current location">{`${location.pathname}${location.search}`}</output>;
}

function renderPage(element, { entry = '/', route = '*' } = {}) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ToastProvider>
        <Routes>
          <Route path={route} element={<>{element}<LocationProbe /></>} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

const featuredAlbum = {
  externalId: '594061854',
  title: 'Rumours',
  artist: 'Fleetwood Mac',
  releaseYear: 1977,
  artworkUrl: 'https://example.test/rumours.jpg',
};

const savedAlbum = {
  id: 'album-1',
  externalId: '594061854',
  title: 'Rumours',
  artist: 'Fleetwood Mac',
  releaseYear: 1977,
  artworkUrl: 'https://example.test/rumours.jpg',
  trackCount: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'user-1', username: 'listener' };
  mocks.albumsRecent.mockResolvedValue({ albums: [] });
  mocks.catalogFeatured.mockResolvedValue({ albums: [] });
  mocks.catalogSearch.mockResolvedValue({ results: [], total: 0 });
  mocks.catalogAlbum.mockResolvedValue({ album: featuredAlbum, related: [] });
  mocks.collectionsList.mockResolvedValue({ collections: [] });
  mocks.collectionsCreate.mockResolvedValue({
    collection: { id: 'collection-new', name: 'New records', description: 'For later', albumCount: 0 },
  });
  mocks.collectionsGet.mockResolvedValue({
    collection: { id: 'collection-1', name: 'Favourites', description: 'Records I love', albumCount: 0, albums: [] },
  });
  mocks.collectionsUpdate.mockImplementation(async (id, payload) => ({
    collection: { id, ...payload, albumCount: 0 },
  }));
  mocks.collectionsRemove.mockResolvedValue(null);
  mocks.collectionsRemoveAlbum.mockResolvedValue(null);
  mocks.collectionsAddAlbum.mockResolvedValue({ album: savedAlbum });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Home page', () => {
  it('shows TrackStack branding and primary navigation', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(
      <MemoryRouter>
        <ToastProvider>
          <AppLayout />
        </ToastProvider>
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('link', { name: /trackstack/i })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Browse' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'My Collections' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders featured albums, recent albums, collections and navigates searches', async () => {
    const user = userEvent.setup();
    mocks.catalogFeatured.mockResolvedValue({ albums: [featuredAlbum] });
    mocks.albumsRecent.mockResolvedValue({ albums: [savedAlbum] });
    mocks.collectionsList.mockResolvedValue({
      collections: [{ id: 'collection-1', name: 'Favourites', albumCount: 1 }],
    });

    renderPage(<Home />);

    expect(await screen.findByRole('heading', { name: /your music/i })).toBeInTheDocument();
    expect(await screen.findAllByRole('heading', { name: 'Rumours' })).toHaveLength(2);
    expect(screen.getByText('Favourites')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create collection/i })).toHaveAttribute('href', '/collections?create=true');

    await user.type(screen.getByRole('searchbox', { name: /search the music catalogue/i }), 'Radiohead');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByLabelText('Current location')).toHaveTextContent('/browse?q=Radiohead');
  });

  it('shows an empty collections message when the signed-in user has none', async () => {
    renderPage(<Home />);
    expect(await screen.findByText(/no collections yet/i)).toBeInTheDocument();
  });

  it('renders user-provided collection names as text, not markup', async () => {
    const unsafeName = '<img src=x onerror=alert(1)>';
    mocks.collectionsList.mockResolvedValueOnce({
      collections: [{ id: 'collection-xss', name: unsafeName, albumCount: 0 }],
    });
    const { container } = renderPage(<Collections />);

    expect(await screen.findByText(unsafeName)).toBeInTheDocument();
    expect(container.querySelector('img[src="x"]')).toBeNull();
  });

  it('shows errors when featured albums, collections, or recent albums fail to load', async () => {
    mocks.catalogFeatured.mockRejectedValueOnce(new Error('Featured unavailable'));
    mocks.collectionsList.mockRejectedValueOnce(new Error('Collections unavailable'));
    mocks.albumsRecent.mockRejectedValueOnce(new Error('Recent albums unavailable'));

    renderPage(<Home />);

    expect(await screen.findByText('Featured unavailable')).toBeInTheDocument();
    expect(screen.getByText('Collections unavailable')).toBeInTheDocument();
    expect(screen.getByText('Recent albums unavailable')).toBeInTheDocument();
  });
});

describe('Browse page', () => {
  it('renders matching search results and applies genre filtering', async () => {
    const user = userEvent.setup();
    mocks.catalogSearch.mockResolvedValue({ results: [featuredAlbum], total: 1 });
    renderPage(<Browse />, { entry: '/browse?q=Rumours' });

    expect(await screen.findByRole('heading', { name: 'Rumours' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filter by genre'), 'Rock');
    await waitFor(() => {
      expect(mocks.catalogSearch).toHaveBeenLastCalledWith({
        q: 'Rumours',
        genre: 'Rock',
        limit: 24,
      });
    });
  });

  it('shows a no-results message when a search has no matches', async () => {
    renderPage(<Browse />, { entry: '/browse?q=missing' });
    expect(await screen.findByText(/no albums match your search/i)).toBeInTheDocument();
  });

  it('shows useful errors when catalogue searches fail', async () => {
    mocks.catalogSearch.mockRejectedValueOnce(new Error('Catalogue unavailable'));
    renderPage(<Browse />, { entry: '/browse?q=missing' });
    expect(await screen.findByText('Catalogue unavailable')).toBeInTheDocument();
  });

  it('keeps the loading state while searching and renders a large result set', async () => {
    let resolveSearch;
    mocks.catalogSearch.mockReturnValueOnce(new Promise((resolve) => { resolveSearch = resolve; }));
    renderPage(<Browse />, { entry: '/browse?q=large' });

    expect(await screen.findByText('Searching albums…')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /search the music catalogue/i })).toBeEnabled();

    const results = Array.from({ length: 50 }, (_, index) => ({
      ...featuredAlbum,
      externalId: String(10000 + index),
      title: `Large result ${index}`,
    }));
    resolveSearch({ results, total: results.length });

    expect(await screen.findByRole('heading', { name: 'Large result 49' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(50);
  });

  it('does not request empty or whitespace-only searches', async () => {
    const user = userEvent.setup();
    renderPage(<Browse />, { entry: '/browse' });
    const search = screen.getByRole('searchbox', { name: /search the music catalogue/i });

    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.type(search, '   ');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(screen.getByLabelText('Current location')).toHaveTextContent('/browse');
    expect(mocks.catalogSearch).not.toHaveBeenCalled();
  });

  it('does not let an older search response replace newer results', async () => {
    const user = userEvent.setup();
    let resolveOlder;
    let resolveNewer;
    mocks.catalogSearch
      .mockReturnValueOnce(new Promise((resolve) => { resolveOlder = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { resolveNewer = resolve; }));
    renderPage(<Browse />, { entry: '/browse?q=older' });

    await waitFor(() => expect(mocks.catalogSearch).toHaveBeenCalledWith({
      q: 'older',
      genre: '',
      limit: 24,
    }));

    const search = screen.getByRole('searchbox', { name: /search the music catalogue/i });
    await user.clear(search);
    await user.type(search, 'newer');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(mocks.catalogSearch).toHaveBeenLastCalledWith({
      q: 'newer',
      genre: '',
      limit: 24,
    }));

    resolveNewer({ results: [{ ...featuredAlbum, title: 'Newer result' }] });
    expect(await screen.findByRole('heading', { name: 'Newer result' })).toBeInTheDocument();
    resolveOlder({ results: [{ ...featuredAlbum, title: 'Older result' }] });
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Older result' })).not.toBeInTheDocument());
  });
});

describe('Album details page', () => {
  it('renders album metadata and tracks, and handles absent optional fields', async () => {
    mocks.catalogAlbum.mockResolvedValueOnce({
      album: {
        ...featuredAlbum,
        tracks: [{ externalId: 'track-1', trackNumber: 1, title: 'Dreams', durationMs: 257000 }],
      },
      related: [],
    });
    renderPage(<AlbumDetail />, { entry: '/album/catalog/594061854', route: '/album/catalog/:externalId' });

    expect(await screen.findByRole('heading', { name: 'Rumours' })).toBeInTheDocument();
    expect(screen.getByText(/Fleetwood Mac/)).toBeInTheDocument();
    expect(screen.getByText(/Dreams/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Rumours' })).toHaveAttribute('src', featuredAlbum.artworkUrl);
  });

  it('uses artwork and track-list fallbacks when catalogue metadata is missing', async () => {
    mocks.catalogAlbum.mockResolvedValueOnce({
      album: {
        externalId: '594061854',
        title: 'Untitled recording',
        artist: 'Unknown artist',
        releaseYear: null,
        genre: '',
        artworkUrl: null,
        tracks: [],
      },
      related: [],
    });
    renderPage(<AlbumDetail />, { entry: '/album/catalog/594061854', route: '/album/catalog/:externalId' });

    expect(await screen.findByRole('heading', { name: 'Untitled recording' })).toBeInTheDocument();
    expect(screen.getByText(/Unknown genre/)).toBeInTheDocument();
    expect(screen.getByText('No track listing available.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Untitled recording' }).getAttribute('src'))
      .toContain('via.placeholder.com');
  });

  it('loads a saved album by its local identifier', async () => {
    mocks.albumsSaved.mockResolvedValueOnce({
      album: { ...savedAlbum, tracks: [] },
      catalogueAvailable: false,
    });
    renderPage(<AlbumDetail />, { entry: '/album/album-1', route: '/album/:albumId' });
    expect(await screen.findByRole('heading', { name: 'Rumours' })).toBeInTheDocument();
    expect(mocks.albumsSaved).toHaveBeenCalledWith('album-1');
  });

  it('shows a useful error when album details cannot be loaded', async () => {
    mocks.catalogAlbum.mockRejectedValueOnce(new Error('Album unavailable'));
    renderPage(<AlbumDetail />, { entry: '/album/catalog/invalid', route: '/album/catalog/:externalId' });

    expect(await screen.findByText('Album not found.')).toBeInTheDocument();
    expect(screen.getByText('Album unavailable')).toBeInTheDocument();
  });

  it('opens a collection picker and adds the album to the selected collection', async () => {
    const user = userEvent.setup();
    mocks.collectionsList.mockResolvedValueOnce({
      collections: [{ id: 'collection-1', name: 'Favourites' }],
    });
    renderPage(<AlbumDetail />, { entry: '/album/catalog/594061854', route: '/album/catalog/:externalId' });

    await user.click(await screen.findByRole('button', { name: 'Add to collection' }));
    expect(await screen.findByText('Choose a collection')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add to Favourites' }));

    await waitFor(() => expect(mocks.collectionsAddAlbum).toHaveBeenCalledWith(
      'collection-1',
      { externalId: '594061854' },
    ));
  });
});

describe('Collections pages', () => {
  it('lists owned collections and shows the empty state', async () => {
    mocks.collectionsList.mockResolvedValueOnce({
      collections: [{ id: 'collection-1', name: 'Favourites', albumCount: 2, createdAt: '2025-01-01T00:00:00Z' }],
    });
    renderPage(<Collections />);
    expect(await screen.findByRole('link', { name: /view favourites collection/i })).toBeInTheDocument();
    expect(screen.getByText('2 albums')).toBeInTheDocument();

    cleanup();
    renderPage(<Collections />);
    expect(await screen.findByText(/you don't have any collections yet/i)).toBeInTheDocument();
  });

  it('creates, renames, and deletes collections from the collection page', async () => {
    const user = userEvent.setup();
    mocks.collectionsList.mockResolvedValueOnce({
      collections: [{
        id: 'collection-1',
        name: 'Favourites',
        description: '',
        albumCount: 0,
        createdAt: '2025-01-01T00:00:00Z',
      }],
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage(<Collections />);

    await user.click(await screen.findByRole('button', { name: 'Create collection' }));
    await user.type(screen.getByLabelText('Name'), 'New records');
    await user.type(screen.getByLabelText('Description (optional)'), 'For later');
    await user.click(screen.getByRole('button', { name: 'Save collection' }));
    await waitFor(() => expect(mocks.collectionsCreate).toHaveBeenCalledWith({
      name: 'New records',
      description: 'For later',
    }));
    expect(await screen.findByRole('link', { name: /view new records collection/i })).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Rename' })[1]);
    const editName = screen.getByLabelText('Name');
    await user.clear(editName);
    await user.type(editName, 'Updated favourites');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(mocks.collectionsUpdate).toHaveBeenCalledWith(
      'collection-1',
      { name: 'Updated favourites', description: '' },
    ));
    expect(await screen.findByRole('link', { name: /view updated favourites collection/i })).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    await waitFor(() => expect(mocks.collectionsRemove).toHaveBeenCalledWith('collection-1'));
    expect(screen.queryByRole('link', { name: /view updated favourites collection/i })).not.toBeInTheDocument();
  });

  it('keeps form input after API failure and does not delete when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    mocks.collectionsCreate.mockRejectedValueOnce(new Error('Save failed'));
    mocks.collectionsList.mockResolvedValueOnce({
      collections: [{ id: 'collection-1', name: 'Favourites', albumCount: 0 }],
    });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage(<Collections />);

    await user.click(await screen.findByRole('button', { name: 'Create collection' }));
    const name = screen.getByLabelText('Name');
    await user.type(name, 'Keep this input');
    await user.click(screen.getByRole('button', { name: 'Save collection' }));
    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(name).toHaveValue('Keep this input');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(confirm).toHaveBeenCalledWith('Delete "Favourites" and its album list?');
    expect(mocks.collectionsRemove).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /view favourites collection/i })).toBeInTheDocument();
  });

  it('prevents repeated deletion while the request is pending', async () => {
    const user = userEvent.setup();
    let finishDelete;
    mocks.collectionsList.mockResolvedValueOnce({
      collections: [{ id: 'collection-1', name: 'Favourites', albumCount: 0 }],
    });
    mocks.collectionsRemove.mockReturnValueOnce(new Promise((resolve) => { finishDelete = resolve; }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage(<Collections />);

    const deleteButton = await screen.findByRole('button', { name: 'Delete' });
    await user.click(deleteButton);
    expect(deleteButton).toBeDisabled();
    await user.click(deleteButton);
    expect(mocks.collectionsRemove).toHaveBeenCalledTimes(1);

    finishDelete();
    await waitFor(() => expect(mocks.collectionsRemove).toHaveBeenCalledTimes(1));
  });

  it('loads collection albums and removes one after confirmation', async () => {
    const user = userEvent.setup();
    mocks.collectionsGet
      .mockResolvedValueOnce({
        collection: {
          id: 'collection-1',
          name: 'Favourites',
          description: 'Records I love',
          albumCount: 1,
          createdAt: '2025-01-01T00:00:00Z',
          albums: [savedAlbum],
        },
      })
      .mockResolvedValueOnce({
        collection: {
          id: 'collection-1',
          name: 'Favourites',
          description: 'Records I love',
          albumCount: 0,
          albums: [],
        },
      });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage(<CollectionDetail />, { entry: '/collections/collection-1', route: '/collections/:collectionId' });

    expect(await screen.findByRole('heading', { name: 'Favourites' })).toBeInTheDocument();
    expect(screen.getByText('Rumours')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Rumours/ })).toHaveAttribute('href', '/album/album-1');
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(mocks.collectionsRemoveAlbum).toHaveBeenCalledWith('collection-1', 'album-1'));
    await waitFor(() => expect(screen.queryByText('Rumours')).not.toBeInTheDocument());
  });

  it('shows a not-found state after a failed collection request', async () => {
    mocks.collectionsGet.mockRejectedValueOnce(new Error('Collection unavailable'));
    renderPage(<CollectionDetail />, { entry: '/collections/missing', route: '/collections/:collectionId' });
    expect(await screen.findByText('Collection not found.')).toBeInTheDocument();
    expect(screen.getByText('Collection unavailable')).toBeInTheDocument();
  });

  it('shows a helpful empty state for a collection without albums', async () => {
    mocks.collectionsGet.mockResolvedValueOnce({
      collection: {
        id: 'collection-1',
        name: 'Favourites',
        description: '',
        albumCount: 0,
        albums: [],
      },
    });
    renderPage(<CollectionDetail />, { entry: '/collections/collection-1', route: '/collections/:collectionId' });

    expect(await screen.findByText(/no albums in this collection yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add album to collection' })).toBeInTheDocument();
  });

  it('does not announce success when album removal fails', async () => {
    const user = userEvent.setup();
    mocks.collectionsGet.mockResolvedValueOnce({
      collection: {
        id: 'collection-1',
        name: 'Favourites',
        albumCount: 1,
        albums: [savedAlbum],
      },
    });
    mocks.collectionsRemoveAlbum.mockRejectedValueOnce(new Error('Removal failed'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage(<CollectionDetail />, { entry: '/collections/collection-1', route: '/collections/:collectionId' });

    await user.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Removal failed')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rumours' })).toBeInTheDocument();
  });
});

describe('Add album page', () => {
  it('searches iTunes results and adds a selected album to its collection', async () => {
    const user = userEvent.setup();
    mocks.catalogSearch.mockResolvedValueOnce({ results: [featuredAlbum] });
    renderPage(<AddAlbum />, { entry: '/collections/collection-1/add', route: '/collections/:collectionId/add' });

    const search = screen.getByRole('searchbox', { name: /search the music catalogue/i });
    await user.type(search, 'Rumours');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('heading', { name: 'Rumours' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add to collection' }));

    await waitFor(() => expect(mocks.collectionsAddAlbum).toHaveBeenCalledWith('collection-1', { externalId: '594061854' }));
  });

  it('validates required manual fields and submits valid manual entries', async () => {
    const user = userEvent.setup();
    renderPage(<AddAlbum />, { entry: '/collections/collection-1/add', route: '/collections/:collectionId/add' });
    await user.click(screen.getByRole('button', { name: 'Manual entry' }));
    const form = screen.getByRole('heading', { name: 'Add album manually' }).closest('form');
    expect(form).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add album' }));
    expect(form.checkValidity()).toBe(false);
    expect(mocks.collectionsAddAlbum).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Album title'), 'Blue');
    await user.type(screen.getByLabelText('Artist'), 'Joni Mitchell');
    await user.type(screen.getByLabelText('Release year'), '1971');
    await user.click(screen.getByRole('button', { name: 'Add album' }));

    await waitFor(() => expect(mocks.collectionsAddAlbum).toHaveBeenCalledWith('collection-1', {
      manual: expect.objectContaining({ title: 'Blue', artist: 'Joni Mitchell', releaseYear: 1971 }),
    }));
  });

  it('does not report success when an album cannot be saved', async () => {
    const user = userEvent.setup();
    mocks.collectionsAddAlbum.mockRejectedValueOnce(new Error('Save unavailable'));
    renderPage(<AddAlbum />, { entry: '/collections/collection-1/add', route: '/collections/:collectionId/add' });
    await user.click(screen.getByRole('button', { name: 'Manual entry' }));
    await user.type(screen.getByLabelText('Album title'), 'Blue');
    await user.type(screen.getByLabelText('Artist'), 'Joni Mitchell');
    await user.click(screen.getByRole('button', { name: 'Add album' }));

    expect(await screen.findByText('Save unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Album added to collection manually!')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Album title')).toHaveValue('Blue');
  });

  it('prevents repeated album saves while the request is pending', async () => {
    const user = userEvent.setup();
    let finishSave;
    mocks.collectionsAddAlbum.mockReturnValueOnce(new Promise((resolve) => { finishSave = resolve; }));
    renderPage(<AddAlbum />, { entry: '/collections/collection-1/add', route: '/collections/:collectionId/add' });
    await user.click(screen.getByRole('button', { name: 'Manual entry' }));
    await user.type(screen.getByLabelText('Album title'), 'Blue');
    await user.type(screen.getByLabelText('Artist'), 'Joni Mitchell');

    const saveButton = screen.getByRole('button', { name: 'Add album' });
    await user.click(saveButton);
    expect(saveButton).toBeDisabled();
    await user.click(saveButton);
    expect(mocks.collectionsAddAlbum).toHaveBeenCalledTimes(1);

    finishSave({ album: savedAlbum });
    await waitFor(() => expect(mocks.collectionsAddAlbum).toHaveBeenCalledTimes(1));
  });
});

describe('Other application pages', () => {
  it('renders the community page and the not-found recovery links', () => {
    const { unmount } = renderPage(<Community />);
    expect(screen.getByRole('heading', { name: 'Community' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Share a collection' })).toBeInTheDocument();
    unmount();

    renderPage(<NotFound />, { entry: '/missing' });
    expect(screen.getByRole('heading', { name: /off the map/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Browse albums' })).toHaveAttribute('href', '/browse');
  });
});
