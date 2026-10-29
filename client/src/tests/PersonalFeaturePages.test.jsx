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
}));

vi.mock('../services/index.js', () => ({
  wantlistService: { list: featureMocks.wantlistList, update: featureMocks.wantlistUpdate, remove: featureMocks.wantlistRemove },
  listeningService: { list: featureMocks.historyList, review: featureMocks.historyReview },
}));

function renderPage(page) {
  return render(<MemoryRouter><ToastProvider>{page}</ToastProvider></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  featureMocks.wantlistList.mockResolvedValue({ items: [{ id: 'album-1', externalId: '123', title: 'Blue', artist: 'Joni Mitchell', preferredEdition: '', notes: '' }] });
  featureMocks.wantlistUpdate.mockResolvedValue({ updated: true });
  featureMocks.wantlistRemove.mockResolvedValue(null);
  featureMocks.historyList.mockResolvedValue({ history: [{ historyId: 'listen-1', id: 'album-1', title: 'Blue', artist: 'Joni Mitchell', listenedAt: '2026-10-20T12:00:00Z', rating: null, review: null }] });
  featureMocks.historyReview.mockResolvedValue({ updated: true });
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
    }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(featureMocks.wantlistRemove).toHaveBeenCalledWith('album-1'));
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
