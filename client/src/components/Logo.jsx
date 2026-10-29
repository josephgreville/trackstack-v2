import { Link } from 'react-router-dom';

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link className={`brand ${className}`.trim()} to={to} aria-label="TrackStack home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" role="presentation">
          <circle cx="20" cy="20" r="17" fill="currentColor" opacity=".1" />
          <circle cx="20" cy="20" r="13.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="20" cy="20" r="9" fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".55" />
          <circle cx="20" cy="20" r="5" fill="#F47745" />
          <circle cx="20" cy="20" r="1.3" fill="#292725" />
          <path d="M31.5 8.5c2.6 2.3 4.2 5.6 4.5 9.2" stroke="#F47745" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </span>
      <span className="brand-word">
        Track<span>Stack</span>
      </span>
    </Link>
  );
}
