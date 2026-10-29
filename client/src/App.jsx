import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import AppLayout from './layout/AppLayout.jsx';
import AuthLayout from './layout/AuthLayout.jsx';
import Home from './pages/Home.jsx';
import Browse from './pages/Browse.jsx';
import AlbumDetail from './pages/AlbumDetail.jsx';
import Collections from './pages/Collections.jsx';
import CollectionDetail from './pages/CollectionDetail.jsx';
import AddAlbum from './pages/add-album/AddAlbum.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Community from './pages/Community.jsx';
import NotFound from './pages/NotFound.jsx';
import Wantlist from './pages/Wantlist.jsx';
import ListeningHistory from './pages/ListeningHistory.jsx';
import ListeningQueue from './pages/ListeningQueue.jsx';
import SharedCollection from './pages/SharedCollection.jsx';
import PublicProfile from './pages/PublicProfile.jsx';
import PageLoader from './components/PageLoader.jsx';
import { PlayerProvider } from './context/PlayerContext.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader label="Opening your collection" />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <Outlet />;
}

function GuestOnly() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader label="Opening TrackStack" />;
  if (user) {
    const returnTo = location.state?.from;
    const destination = typeof returnTo === 'string'
      && returnTo.startsWith('/')
      && !returnTo.startsWith('//')
      ? returnTo
      : '/';
    return <Navigate to={destination} replace />;
  }
  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="browse" element={<Browse />} />
          <Route path="share/:token" element={<SharedCollection />} />
          <Route path="users/:username" element={<PublicProfile />} />
          <Route path="album/catalog/:externalId" element={<AlbumDetail />} />
          <Route path="album/:albumId" element={<AlbumDetail />} />
          <Route path="collections" element={<Collections />} />
          <Route path="collections/:collectionId" element={<CollectionDetail />} />
          <Route path="collections/:collectionId/add" element={<AddAlbum />} />
          <Route path="community" element={<Community />} />
          <Route path="wantlist" element={<Wantlist />} />
          <Route path="listening-history" element={<ListeningHistory />} />
          <Route path="listen-next" element={<ListeningQueue />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route element={<GuestOnly />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <PlayerProvider>
            <ScrollToTop />
            <AppRoutes />
          </PlayerProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
