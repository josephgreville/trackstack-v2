import { useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cx } from '../utils/format';

const NAV_ITEMS = [
  { to: '/', label: 'Home', match: (p) => p === '/' },
  { to: '/browse', label: 'Browse', match: (p) => p.startsWith('/browse') },
  { to: '/collections', label: 'My Collections', match: (p) => p.startsWith('/collections') },
  { to: '/community', label: 'Community', match: (p) => p.startsWith('/community') },
];

export default function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    const handlePop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    window.addEventListener('popstate', handlePop);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => window.removeEventListener('popstate', handlePop);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-cream text-charcoal flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-paper border-r border-line min-h-screen sticky top-0">
        <div className="p-6 border-b border-line">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-700 tracking-wider text-charcoal">
            <span className="inline-block w-8 h-8 rounded bg-orange text-paper flex items-center justify-center font-mono text-sm">TS</span>
            TrackStack
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = item.match(location.pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cx(
                  'block px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-orange-soft text-orange'
                    : 'text-brown hover:bg-cream hover:text-charcoal',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-line text-xs text-brown-line">
          Your records, properly kept.
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-paper border-b border-line px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-display text-lg font-700 tracking-wider text-charcoal">
          TrackStack
        </Link>
        <nav className="flex gap-3 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cx(
                item.match(location.pathname) ? 'text-orange font-medium' : 'text-brown',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="flex-1 md:ml-0 mt-14 md:mt-0">
        <div className="container-narrow py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
