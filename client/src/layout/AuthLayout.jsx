import { Link, Outlet } from 'react-router-dom';
import { cx } from '../utils/format';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <div className="container-narrow max-w-md py-8">
        <Outlet />
      </div>
    </div>
  );
}