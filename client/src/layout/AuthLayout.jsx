import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AuthLayout() {
  const { pathname } = useLocation();
  const registering = pathname === '/register';

  return (
    <div className="auth-scene">
      <main className="auth-card">
        <section className="auth-art" aria-label="TrackStack introduction">
          <Link to="/" className="auth-brand"><span>TS</span> TrackStack</Link>
          <div className="auth-record-art" aria-hidden="true">
            <svg viewBox="0 0 300 300" fill="none">
              <path d="M175 48v157a48 48 0 1 1-21-40V86l111 27v116a48 48 0 1 1-21-40V97L175 72" stroke="currentColor" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M56 102c-18 0-18 29 0 29M238 41v28m-14-14h28M50 234v30m-15-15h30" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
              <circle cx="248" cy="237" r="7" fill="currentColor" />
            </svg>
          </div>
          <div className="auth-art-copy">
            <h1>{registering ? 'Join us' : 'Welcome back'}</h1>
            <p>Your records, your sound, all in one place.</p>
          </div>
        </section>

        <section className="auth-panel">
          <nav className="auth-switch" aria-label="Account">
            <Link to="/login" className={!registering ? 'active' : ''}>Login</Link>
            <Link to="/register" className={registering ? 'active' : ''}>Sign up</Link>
          </nav>
          <Outlet />
        </section>
      </main>
    </div>
  );
}
