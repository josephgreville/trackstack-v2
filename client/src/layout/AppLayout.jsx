import { useEffect, useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { cx, initials } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';
import Logo from '../components/Logo.jsx';
import PlayerBar from '../components/PlayerBar.jsx';
import {
  IconHome, IconCompass, IconCollection, IconDisc, IconClock,
  IconUser, IconMenu, IconClose,
} from '../components/Icons.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Home', match: (path) => path === '/', Icon: IconHome },
  { to: '/browse', label: 'Browse', match: (path) => path.startsWith('/browse'), Icon: IconCompass },
  { to: '/collections', label: 'My Collections', match: (path) => path.startsWith('/collections'), Icon: IconCollection },
  { to: '/wantlist', label: 'Wantlist', match: (path) => path.startsWith('/wantlist'), Icon: IconDisc },
  { to: '/listening-history', label: 'Listening History', match: (path) => path.startsWith('/listening-history'), Icon: IconClock },
  { to: '/community', label: 'Community', match: (path) => path.startsWith('/community'), Icon: IconUser },
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

  useEffect(() => {
    const handlePop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    window.addEventListener('popstate', handlePop);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => window.removeEventListener('popstate', handlePop);
  }, [location.pathname]);

  const navigation = (className = '') => (
    <nav className={className} aria-label="Primary navigation">
      {NAV_ITEMS.map(({ to, label, match, Icon }) => {
        const active = match(location.pathname);
        return (
          <Link key={to} to={to} aria-current={active ? 'page' : undefined}
            className={cx('app-nav-link', active && 'is-active')}>
            <Icon size={19} /><span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
  const activeSection = NAV_ITEMS.find((item) => item.match(location.pathname))?.label ?? 'TrackStack';

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand-wrap"><Logo className="app-brand" /></div>
        <p className="app-nav-caption">YOUR MUSIC</p>
        {navigation('app-sidebar-nav')}
        <div className="app-sidebar-footer">
          {!isLoading && user && <>
            <div className="app-user-card">
              <span className="app-avatar" aria-hidden="true">{initials(user.username)}</span>
              <span className="app-user-copy"><strong>{user.username}</strong><small>Signed in</small></span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleLogout}>Log out</Button>
          </>}
        </div>
      </aside>

      <div className="app-main-column">
        <header className="app-mobile-header">
          <Logo className="app-brand" />
          <button className="app-menu-toggle" type="button" aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileMenuOpen} aria-controls="mobile-primary-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}>
            {mobileMenuOpen ? <IconClose /> : <IconMenu />}
          </button>
          <nav id="mobile-primary-navigation" className="app-mobile-nav" hidden={!mobileMenuOpen} aria-label="Mobile navigation">
            {NAV_ITEMS.map(({ to, label, match, Icon }) => (
              <Link key={to} to={to} aria-current={match(location.pathname) ? 'page' : undefined}>
                <Icon size={19} /><span>{label}</span>
              </Link>
            ))}
            <button type="button" onClick={handleLogout}>Log out</button>
          </nav>
        </header>

        <main className="app-main player-safe-area">
          <div className="app-topbar">
            <p><span>TRACKSTACK</span><span className="app-breadcrumb-divider">/</span><strong>{activeSection}</strong></p>
            <span className="app-private-badge"><i /> Private workspace</span>
          </div>
          <div className="container-narrow app-content"><Outlet /></div>
        </main>
      </div>
      <PlayerBar />
    </div>
  );
}
