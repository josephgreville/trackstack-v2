import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconMusic, IconSpark } from '../components/Icons.jsx';
import { fadeInUp } from '../components/motion.jsx';

export default function AuthLayout() {
  const { pathname } = useLocation();
  const registering = pathname === '/register';

  const floatingElements = [
    { x: -60, y: -40, size: 34, delay: 0 },
    { x: 110, y: -20, size: 22, delay: 0.6 },
    { x: -20, y: 110, size: 26, delay: 1.1 },
    { x: 90, y: 140, size: 18, delay: 0.3 },
    { x: -10, y: 260, size: 30, delay: 0.85 },
    { x: 120, y: 290, size: 20, delay: 1.4 },
  ];

  return (
    <div className="auth-scene" variants={fadeInUp} initial="hidden" animate="show">
      <main className="auth-card" variants={fadeInUp} initial="hidden" animate="show">
        {/* Left art panel */}
        <section className="auth-art" aria-label="TrackStack introduction">
          <Link to="/" className="auth-brand" aria-label="TrackStack home">
            <span>TS</span> TrackStack
          </Link>

          <div className="auth-record-art" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" focusable="false">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3z" />
            </svg>
          </div>

          {/* Floating decorative elements */}
          <div className="auth-floats">
            {floatingElements.map((el, i) => (
              <motion.span
                key={i}
                className="auth-float"
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.size,
                  height: el.size,
                  animationDelay: `${el.delay}s`,
                  opacity: 0.35 + i * 0.05,
                }}
                animate={{
                  y: [-10, -22, -10],
                  opacity: [0.35, 0.6, 0.35],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                aria-hidden="true"
              >
                <IconMusic size={el.size} strokeWidth={1.4} />
              </motion.span>
            ))}
          </div>

          <div className="auth-art-copy">
            <h1>{registering ? 'Join TrackStack' : 'Welcome back'}</h1>
            <p>
              {registering
                ? "Start building the record collection you've always wanted."
                : 'Your records, your sound, all in one place.'}
            </p>
          </div>
        </section>

        {/* Right form panel */}
        <section className="auth-panel">
          <nav className="auth-switch" aria-label="Account">
            <Link to="/login" className={!registering ? 'active' : ''}>
              Login
            </Link>
            <Link to="/register" className={registering ? 'active' : ''}>
              Sign up
            </Link>
          </nav>
          <Outlet />
        </section>
      </main>
    </div>
  );
}
