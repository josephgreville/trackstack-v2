import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext.jsx';
import Wrapped from '../pages/Wrapped.jsx';
import Achievements from '../pages/Achievements.jsx';
import DiscoverWeekly from '../pages/DiscoverWeekly.jsx';
import CollectionRoom from '../pages/CollectionRoom.jsx';
import Notifications from '../pages/Notifications.jsx';
import Stories from '../pages/Stories.jsx';
import Social from '../pages/Social.jsx';
import Profile from '../pages/Profile.jsx';

const mocks = vi.hoisted(() => ({
  user: { id: 'user-1', username: 'listener' },
  wrappedGet: vi.fn(),
  achievementsMe: vi.fn(),
  achievementsList: vi.fn(),
  achievementsCheck: vi.fn(),
  achievementsUpdateProfile: vi.fn(),
  recommendationsList: vi.fn(),
  recommendationsDiscover: vi.fn(),
  recommendationsDismiss: vi.fn(),
  collectionsList: vi.fn(),
  collectionsGet: vi.fn(),
  collectionsUpdate: vi.fn(),
  notificationsList: vi.fn(),
  notificationCount: vi.fn(),
  markAllRead: vi.fn(),
  markRead: vi.fn(),
  storiesList: vi.fn(),
  listeningInsights: vi.fn(),
  activity: vi.fn(),
  globalActivity: vi.fn(),
  followers: vi.fn(),
  following: vi.fn(),
}));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mocks.user, isLoading: false, logout: vi.fn() }),
}));

vi.mock('../services/index.js', () => ({
  wrappedService: { get: mocks.wrappedGet },
  achievementsService: {
    me: mocks.achievementsMe,
    listAchievements: mocks.achievementsList,
    checkAchievements: mocks.achievementsCheck,
    updateProfile: mocks.achievementsUpdateProfile,
  },
  recommendationsService: {
    list: mocks.recommendationsList,
    discoverWeekly: mocks.recommendationsDiscover,
    dismiss: mocks.recommendationsDismiss,
  },
  collectionsService: {
    list: mocks.collectionsList,
    get: mocks.collectionsGet,
    update: mocks.collectionsUpdate,
  },
  socialService: {
    notifications: mocks.notificationsList,
    notificationCount: mocks.notificationCount,
    markAllNotificationsRead: mocks.markAllRead,
    markNotificationRead: mocks.markRead,
    activity: mocks.activity,
    globalActivity: mocks.globalActivity,
    followers: mocks.followers,
    following: mocks.following,
    followStatus: vi.fn(),
    follow: vi.fn(),
    unfollow: vi.fn(),
    comments: vi.fn(),
    likeStatus: vi.fn(),
    like: vi.fn(),
    unlike: vi.fn(),
    addComment: vi.fn(),
  },
  storiesService: {
    listStories: mocks.storiesList,
    getStory: vi.fn(),
    upsertStory: vi.fn(),
  },
  listeningService: {
    insights: mocks.listeningInsights,
    list: vi.fn(),
    log: vi.fn(),
    review: vi.fn(),
  },
  collectionsService: {
    list: mocks.collectionsList,
    get: mocks.collectionsGet,
    update: mocks.collectionsUpdate,
  },
}));

function renderPage(element, { entry = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ToastProvider>
        <Routes>
          <Route path="*" element={element} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

const wrappedPayload = {
  range: 'year',
  label: '2026',
  totalListens: 42,
  uniqueAlbums: 18,
  totalMinutes: 940,
  lastListenedAt: null,
  topArtist: { name: 'Joni Mitchell', listens: 12 },
  topAlbum: {
    id: 'album-1',
    title: 'Blue',
    artist: 'Joni Mitchell',
    artworkUrl: 'https://example.test/blue.jpg',
    externalId: '594061854',
    listens: 9,
    totalMinutes: 180,
  },
  topGenre: { name: 'Folk', listens: 14 },
  topArtists: [{ name: 'Joni Mitchell', listens: 12 }],
  topAlbums: [{ id: 'album-1', title: 'Blue', artist: 'Joni Mitchell', artworkUrl: '', externalId: '1', listens: 9, totalMinutes: 180 }],
  topGenres: [{ name: 'Folk', listens: 14 }],
  decades: [{ decade: '1970s', listens: 8 }],
  formats: [{ name: 'vinyl', listens: 6 }],
  monthly: [{ month: '2026-03', listens: 5 }, { month: '2026-04', listens: 9 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.wrappedGet.mockResolvedValue(wrappedPayload);
  mocks.achievementsMe.mockResolvedValue({
    profile: { id: 'user-1', username: 'listener', xp: 320, level: 3, xpForNext: 340, progress: 42, bio: '', profilePublic: false },
  });
  mocks.achievementsList.mockResolvedValue({
    achievements: [
      { id: 'a1', key: 'first_listen', name: 'First Spin', description: 'Logged your first album listen.', icon: 'play', xpReward: 50, earned: true, earnedAt: '2026-01-05' },
      { id: 'a2', key: 'century_collector', name: 'Century Collector', description: 'Collected 100 albums.', icon: 'collection', xpReward: 500, earned: false, earnedAt: null },
    ],
  });
  mocks.achievementsCheck.mockResolvedValue({ earned: [] });
  mocks.achievementsUpdateProfile.mockResolvedValue({ profile: { bio: 'Vinyl only, always.' } });
  mocks.recommendationsList.mockResolvedValue({ recommendations: [] });
  mocks.recommendationsDiscover.mockResolvedValue({ recommendations: [] });
  mocks.collectionsList.mockResolvedValue({ collections: [] });
  mocks.collectionsGet.mockResolvedValue({ collection: { id: 'c1', name: 'Vinyl', albumCount: 0, albums: [], shelfTheme: 'classic' } });
  mocks.notificationsList.mockResolvedValue({ notifications: [] });
  mocks.notificationCount.mockResolvedValue({ count: 0 });
  mocks.storiesList.mockResolvedValue({ stories: [] });
  mocks.listeningInsights.mockResolvedValue({ insights: { totalListens: 27, streakDays: 4, topArtists: [] } });
  mocks.activity.mockResolvedValue({ activity: [] });
  mocks.globalActivity.mockResolvedValue({ activity: [] });
  mocks.followers.mockResolvedValue({ followers: [] });
  mocks.following.mockResolvedValue({ following: [] });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TrackStack 2.0 — Wrapped', () => {
  it('shows the recap totals, top artist, top album and genre', async () => {
    renderPage(<Wrapped />);
    expect(await screen.findByRole('heading', { name: /TrackStack Wrapped/i })).toBeInTheDocument();
    expect(await screen.findByText('42')).toBeInTheDocument();
    // The artist appears in the highlight card and again in the ranked list.
    expect(screen.getAllByText('Joni Mitchell').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Blue').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Folk').length).toBeGreaterThan(0);
    expect(mocks.wrappedGet).toHaveBeenCalledWith({ range: 'year' });
  });

  it('switches between yearly, monthly and all-time recaps', async () => {
    const user = userEvent.setup();
    renderPage(<Wrapped />);
    await screen.findByRole('heading', { name: /TrackStack Wrapped/i });

    await user.click(screen.getByRole('tab', { name: 'This month' }));
    await waitFor(() => expect(mocks.wrappedGet).toHaveBeenCalledWith({ range: 'month' }));

    await user.click(screen.getByRole('tab', { name: 'All time' }));
    await waitFor(() => expect(mocks.wrappedGet).toHaveBeenCalledWith({ range: 'all' }));
  });
});

describe('TrackStack 2.0 — Achievements', () => {
  it('shows the collector level, XP progress and earned versus locked badges', async () => {
    renderPage(<Achievements />);
    expect(await screen.findByRole('heading', { name: /Achievements/i })).toBeInTheDocument();
    expect(await screen.findByText('First Spin')).toBeInTheDocument();
    expect(screen.getByText('Century Collector')).toBeInTheDocument();

    // The earned badge shows when it was unlocked, the locked one shows its XP.
    expect(await screen.findByText(/Earned 05\/01\/2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Locked · 500 XP/)).toBeInTheDocument();
  });

  it('checks for newly unlocked badges on demand', async () => {
    const user = userEvent.setup();
    renderPage(<Achievements />);
    await screen.findByRole('heading', { name: /Achievements/i });

    await user.click(screen.getByRole('button', { name: /Check for new badges/i }));
    await waitFor(() => expect(mocks.achievementsCheck).toHaveBeenCalled());
  });
});

describe('TrackStack 2.0 — Discover Weekly', () => {
  it('explains why there are no recommendations yet and can generate them', async () => {
    const user = userEvent.setup();
    renderPage(<DiscoverWeekly />);
    expect(await screen.findByRole('heading', { name: /^Discover$/i })).toBeInTheDocument();
    expect(await screen.findByText(/Not enough to go on yet/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Generate recommendations/i }));
    await waitFor(() => expect(mocks.recommendationsDiscover).toHaveBeenCalled());
  });

  it('renders a recommendation with a one-click collection action', async () => {
    mocks.recommendationsList.mockResolvedValue({
      recommendations: [{
        id: 'rec-1',
        album: { id: 'album-9', title: 'Hejira', artist: 'Joni Mitchell', releaseYear: 1976, genre: 'Jazz', artworkUrl: 'https://example.test/hejira.jpg', externalId: '1492263092', trackCount: 11 },
        reason: 'Matches your Jazz taste',
        score: 90,
        kind: 'similar',
        createdAt: '2026-03-01',
      }],
    });
    renderPage(<DiscoverWeekly />);
    expect(await screen.findByRole('heading', { name: 'Hejira' })).toBeInTheDocument();
    expect(screen.getByText(/Matches your Jazz taste/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add to collection/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wantlist/i })).toBeInTheDocument();
  });
});

describe('TrackStack 2.0 — Collection Room', () => {
  it('prompts for a collection when the collector has none', async () => {
    renderPage(<CollectionRoom />);
    expect(await screen.findByRole('heading', { name: /Collection room/i })).toBeInTheDocument();
    expect(await screen.findByText(/Your room is empty/i)).toBeInTheDocument();
  });

  it('renders a shelf of albums for a collection', async () => {
    mocks.collectionsList.mockResolvedValue({
      collections: [{ id: 'c1', name: 'Vinyl shelf', albumCount: 2, shelfTheme: 'walnut' }],
    });
    mocks.collectionsGet.mockResolvedValue({
      collection: {
        id: 'c1',
        name: 'Vinyl shelf',
        albumCount: 2,
        shelfTheme: 'walnut',
        albums: [
          { id: 'a1', title: 'Blue', artist: 'Joni Mitchell', artworkUrl: 'https://example.test/blue.jpg' },
          { id: 'a2', title: 'Hejira', artist: 'Joni Mitchell', artworkUrl: 'https://example.test/hejira.jpg' },
        ],
      },
    });
    renderPage(<CollectionRoom />);
    expect(await screen.findByRole('button', { name: /Vinyl shelf/ })).toBeInTheDocument();
    await waitFor(() => expect(mocks.collectionsGet).toHaveBeenCalledWith('c1', { sort: 'added_at', order: 'desc' }));
    expect(await screen.findByAltText('Blue cover')).toBeInTheDocument();
    expect(screen.getByAltText('Hejira cover')).toBeInTheDocument();
  });
});

describe('TrackStack 2.0 — Notifications', () => {
  it('lists notifications and can mark them all as read', async () => {
    const user = userEvent.setup();
    mocks.notificationsList.mockResolvedValue({
      notifications: [{
        id: 'n1', type: 'follow', actorId: 'user-2', targetType: 'user', targetId: 'user-2',
        message: 'started following you.', read: false, createdAt: '2026-03-02T10:00:00.000Z',
      }],
    });
    mocks.notificationCount.mockResolvedValue({ count: 1 });
    renderPage(<Notifications />);
    expect(await screen.findByText(/started following you/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Mark all as read/i }));
    await waitFor(() => expect(mocks.markAllRead).toHaveBeenCalled());
  });

  it('shows an empty state when there is nothing to read', async () => {
    renderPage(<Notifications />);
    expect(await screen.findByRole('heading', { name: /No notifications/i })).toBeInTheDocument();
  });
});

describe('TrackStack 2.0 — Album Stories', () => {
  it('renders a chronological timeline of stories', async () => {
    mocks.storiesList.mockResolvedValue({
      stories: [{
        id: 's1',
        title: 'The one I always reach for',
        body: 'Bought it the week I moved in.',
        location: 'A record shop in Soho',
        occurredAt: '2019-06-01',
        isPublic: true,
        createdAt: '2026-03-02T10:00:00.000Z',
        album: { id: 'a1', title: 'Blue', artist: 'Joni Mitchell', artworkUrl: 'https://example.test/blue.jpg' },
      }],
    });
    renderPage(<Stories />);
    expect(await screen.findByRole('heading', { name: /Album stories/i })).toBeInTheDocument();
    expect(await screen.findByText('The one I always reach for')).toBeInTheDocument();
    expect(screen.getByText(/Found at A record shop in Soho/)).toBeInTheDocument();
    // "Published" is also a tab label, so scope the check to the story meta row.
    const storyMeta = screen.getByText(/Found at A record shop in Soho/).closest('.story-meta');
    expect(storyMeta).toHaveTextContent('Published');
  });

  it('shows an empty state when a collector has no stories yet', async () => {
    renderPage(<Stories />);
    expect(await screen.findByText(/No stories yet/i)).toBeInTheDocument();
  });
});

describe('TrackStack 2.0 — Community feed', () => {
  it('shows the global activity feed and the following list', async () => {
    mocks.globalActivity.mockResolvedValue({
      activity: [{
        id: 'act-1',
        type: 'listen',
        targetType: 'album',
        targetId: 'a1',
        metadata: { title: 'Blue', artworkUrl: 'https://example.test/blue.jpg' },
        createdAt: '2026-03-02T10:00:00.000Z',
        actor: { username: 'neighbour', avatarUrl: null },
      }],
    });
    mocks.following.mockResolvedValue({
      following: [{ id: 'user-9', username: 'neighbour', avatarUrl: null, followedAt: '2026-03-01' }],
    });
    renderPage(<Social />);
    expect(await screen.findByRole('heading', { name: /Community/i })).toBeInTheDocument();
    expect(await screen.findByText(/listened to/i)).toBeInTheDocument();
    // The collector appears in the feed and in the following list.
    expect(screen.getAllByText('neighbour').length).toBeGreaterThan(0);
  });
});

describe('TrackStack 2.0 — Profile', () => {
  it('shows the collector level, stats and links to the deeper features', async () => {
    mocks.collectionsList.mockResolvedValue({
      collections: [{ id: 'c1', name: 'Vinyl', albumCount: 12 }],
    });
    mocks.followers.mockResolvedValue({
      followers: [{ id: 'user-3', username: 'friend', avatarUrl: null, followedAt: '2026-03-01' }],
    });
    renderPage(<Profile />);

    expect(await screen.findByRole('heading', { name: 'listener' })).toBeInTheDocument();
    // The level shows on the avatar badge and on the XP progress bar.
    expect(screen.getAllByText('LV 3').length).toBeGreaterThan(0);

    // Stats come from the collector's own data.
    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(screen.getByText('27')).toBeInTheDocument();

    // Every deeper feature is reachable from the profile.
    for (const label of ['Wrapped', 'Badges', 'Stories', 'Wantlist', 'Journal', 'Up next', 'Room', 'Alerts']) {
      expect(screen.getByRole('link', { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it('lets the collector edit their bio', async () => {
    const user = userEvent.setup();
    renderPage(<Profile />);
    await screen.findByRole('heading', { name: 'listener' });

    await user.click(screen.getByRole('button', { name: /Edit profile/i }));
    const bio = await screen.findByLabelText(/About you/i);
    await user.clear(bio);
    await user.type(bio, 'Vinyl only, always.');
    await user.click(screen.getByRole('button', { name: /Save profile/i }));
    await waitFor(() => expect(mocks.achievementsUpdateProfile).toHaveBeenCalled());
  });
});
