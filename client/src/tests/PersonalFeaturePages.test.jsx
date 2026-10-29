import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext.jsx';
import Wantlist from '../pages/Wantlist.jsx';
import ListeningHistory from '../pages/ListeningHistory.jsx';

const featureMocks = vi.hoisted(() => ({
  wantlistList: vi.fn(), wantlistUpdate: vi.fn(), wantlistRemove: vi.fn(),
  historyList: vi.fn(), historyReview: vi.fn(),
  historyInsights: vi.fn(), collectionsList: vi.fn(),
  wantlistAcquire: vi.fn(),
}));

vi.mock('../services/index.js', () => ({
  wantlistService: { list: featureMocks.wantlistList, update: featureMocks.wantlistUpdate, remove: featureMocks.wantlistRemove, acquire: featureMocks.wantlistAcquire },
  listeningService: { list: featureMocks.historyList, review: featureMocks.historyReview, insights: featureMocks.historyInsights },
  collectionsService: { list: featureMocks.collectionsList },
}));

function renderPage(page) {
  return render(<MemoryRouter><ToastProvider>{page}</ToastProvider></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  featureMocks.wantlistList.mockResolvedValue({ items: [{ id: 'album-1', externalId: '123', title: 'Blue', artist: 'Joni Mitchell', preferredEdition: '', notes: '' }] });
  featureMocks.wantlistUpdate.mockResolvedValue({ updated: true });
  featureMocks.wantlistRemove.mockResolvedValue(null);
  featureMocks.wantlistAcquire.mockResolvedValue(null);
  featureMocks.collectionsList.mockResolvedValue({ collections: [{ id: 'collection-1', name: 'Favourites' }] });
  featureMocks.historyList.mockResolvedValue({ history: [{ historyId: 'listen-1', id: 'album-1', title: 'Blue', artist: 'Joni Mitchell', listenedAt: '2026-10-20T12:00:00Z', rating: null, review: null }] });
  featureMocks.historyReview.mockResolvedValue({ updated: true });
  featureMocks.historyInsights.mockResolvedValue({ insights: { totalListens: 1, streakDays: 1, topArtists: [{ artist: 'Joni Mitchell', listens: 1 }], unplayedCount: 0, unplayedSamples: [] } });
});

afterEach(() => cleanup());

describe('personal music pages', () => {
  it('saves wantlist edition notes and removes an album', async () => {
    const user = userEvent.setup();
    renderPage(<Wantlist />);
    expect(await screen.findByRole('heading', { name: 'Blue' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Preferred edition'), 'First pressing');
    await user.type(screen.getByLabelText('Notes'), 'Look at the weekend market');
    await user.click(screen.getByRole('button', { name: 'Save notes' }));
    await waitFor(() => expect(featureMocks.wantlistUpdate).toHaveBeenCalledWith('album-1', {
      preferredEdition: 'First pressing', notes: 'Look at the weekend market',
      maxPrice: null,
    }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(featureMocks.wantlistRemove).toHaveBeenCalledWith('album-1'));
  });

  it('moves a found wantlist album into the selected collection with purchase details', async () => {
    const user = userEvent.setup();
    renderPage(<Wantlist />);
    expect(await screen.findByRole('heading', { name: 'Blue' })).toBeInTheDocument();
    await user.click(screen.getByText('Found this album'));
    await user.selectOptions(screen.getByLabelText('Add to collection'), 'collection-1');
    await user.selectOptions(screen.getByLabelText('Format'), 'vinyl');
    await user.type(screen.getByLabelText('Purchase date'), '2026-10-01');
    await user.type(screen.getByLabelText('Price paid (£)'), '24.50');
    await user.click(screen.getByRole('button', { name: 'Move into collection' }));
    await waitFor(() => expect(featureMocks.wantlistAcquire).toHaveBeenCalledWith('album-1', {
      collectionId: 'collection-1', format: 'vinyl', purchaseDate: '2026-10-01', price: 24.5,
    }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Blue' })).not.toBeInTheDocument());
  });

  it('adds a rating and review to a listening history entry', async () => {
    const user = userEvent.setup();
    renderPage(<ListeningHistory />);
    expect(await screen.findByRole('heading', { name: 'Blue' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Rating'), '5');
    await user.type(screen.getByLabelText('Review'), 'Still sounds wonderful');
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    await waitFor(() => expect(featureMocks.historyReview).toHaveBeenCalledWith('listen-1', {
      rating: 5, review: 'Still sounds wonderful',
    }));
  });
});
