import { Link } from 'react-router-dom';
import { cx } from '../utils/format';

export default function NotFound() {
  return (
    <section className="py-24">
      <div className="container-narrow text-center">
        <p className="text-sm uppercase tracking-widest text-brown-line mb-3">
          404
        </p>
        <h1 className="text-4xl font-display font-700 tracking-tighter mb-4">
          This page is off the map
        </h1>
        <p className="text-lg text-brown max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has moved. Let's get you back on track.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className={cx(
              'btn btn-primary',
            )}
          >
            Back home
          </Link>
          <Link
            to="/browse"
            className={cx(
              'btn btn-secondary',
            )}
          >
            Browse albums
          </Link>
        </div>
      </div>
    </section>
  );
}
