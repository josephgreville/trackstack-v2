import { useEffect, useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cx, initials } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';
import Logo from '../components/Logo.jsx';
import PlayerBar from '../components/PlayerBar.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import {
  IconHome, IconCompass, IconCollection, IconUser, IconMenu, IconClose, IconMusic,
} from '../components/Icons.jsx';

/* The five app tabs. Everything else lives one level deeper, inside a tab. */
export const TABS = [
  { to: '/', label: 'Home', Icon: IconHome, match: (path) => path === '/' },
  { to: '/discover', label: 'Discover', Icon: IconCompass, match: (path) => path.startsWith('/discover') || path.startsWith('/browse') },
  { to: '/collections', label: 'Stacks', Icon: IconCollection, match: (path) => path.startsWith('/collections') || path.startsWith('/collection-room') },
  { to: '/social', label: 'Community', Icon: IconUser, match: (path) => path.startsWith('/social') || path.startsWith('/community') },
  { to: '/profile', label: 'You', Icon: IconMusic, match: (path) => path.startsWith('/profile') },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth();
  const { error, success } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      success('You have signed out.');
      navigate('/login', { replace: true });
    } catch (logoutError) {
      error(logoutError.message ?? 'Could not sign out. Please try again.');
    }
  };

  const activeTab = TABS.find((tab) => tab.match(location.pathname));

  return (
    <div className="app-shell">
      {/* Desktop rail */}
      <aside className="app-sidebar">
        <div className="app-brand-wrap"><Logo className="app-brand" /></div>

        <nav className="app-sidebar-nav" aria-label="Primary navigation">
          {TABS.map(({ to, label, Icon, match }) => {
            const active = match(location.pathname);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cx('app-nav-link', active && 'is-active')}
              >
                {active && (
                  <motion.span
                    layoutId="app-nav-pill"
                    className="app-nav-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    aria-hidden="true"
                  />
                )}
                <span className="app-nav-icon" aria-hidden="true"><Icon size={22} /></span>
                <span className="app-nav-text">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="app-sidebar-footer">
          {!isLoading && user && (
            <>
              <Link to="/profile" className="app-user-card">
                <span className="app-avatar" aria-hidden="true">{initials(user.username)}</span>
                <span className="app-user-copy"><strong>{user.username}</strong><small>Your profile</small></span>
              </Link>
              <Button type="button" variant="outline" size="sm" onClick={handleLogout}>Log out</Button>
            </>
          )}
        </div>
      </aside>

      <div className="app-main-column">
        <header className="app-mobile-header">
          <Logo className="app-brand" />
          <div className="app-mobile-actions">
            <NotificationBell />
            <button className="app-menu-toggle" type="button" aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileMenuOpen} aria-controls="mobile-primary-navigation"
              onClick={() => setMobileMenuOpen((open) => !open)}>
              {mobileMenuOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </header>

        <main className="app-main player-safe-area">
          <div className="app-topbar">
            <p><span>TRACKSTACK</span><span className="app-breadcrumb-divider">/</span><strong>{activeTab?.label ?? 'TrackStack'}</strong></p>
            <div className="app-topbar-right">
              <NotificationBell />
              <span className="app-private-badge"><i /> Private workspace</span>
            </div>
          </div>
          <div className="container-narrow app-content"><Outlet /></div>
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav className="app-tabbar" aria-label="Primary navigation">
        {TABS.map(({ to, label, Icon, match }) => {
          const active = match(location.pathname);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={cx('app-tab', active && 'is-active')}
            >
              {active && (
                <motion.span
                  layoutId="app-tab-pill"
                  className="app-tab-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  aria-hidden="true"
                />
              )}
              <span className="app-tab-icon" aria-hidden="true"><Icon size={22} /></span>
              <span className="app-tab-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      <PlayerBar />
    </div>
  );
}
