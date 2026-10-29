import { useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cx } from '../utils/format';

export default function AppLayout({ children }) {
  const location = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handlePop = () => {
      scrollToTop();
    };
    window.addEventListener('popstate', handlePop);
    scrollToTop();
    return () => window.removeEventListener('popstate', handlePop);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <nav className="border-b line bg-paper shadow-sm shadow-orange-soft">
        <div className="container-narrow flex items-center justify-between h-full">
          <Link to="/" className="font-display text-xl font-700 tracking-wider">
            TrackStack
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/browse" className={cx(
              'text-brown',
              location.pathname === '/browse' ? 'font-medium text-orange' : 'hover:text-orange',
            )} role="button" aria-current="page">
              Browse Music
            </Link>
            <Link to="/collections" className={cx(
              'text-brown',
              location.pathname.startsWith('/collections') ? 'font-medium text-orange' : 'hover:text-orange',
            )} role="button">
              My Collections
            </Link>
          </div>
        </div>
      </nav>

      <main className="container-narrow py-8">
        <Outlet />
      </main>
    </div>
  );
}