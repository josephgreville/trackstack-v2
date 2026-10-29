import { Link } from 'react-router-dom';
import { cx } from '../utils/format';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <div className="container-narrow max-w-md py-8">
        {children}
      </div>
    </div>
  );
}