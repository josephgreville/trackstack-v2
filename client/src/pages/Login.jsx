import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { cx } from '../utils/format';
import Button from '../components/Button.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      success(`Welcome back, ${user.username}!`);
      const returnTo = location.state?.from;
      const destination = typeof returnTo === 'string'
        && returnTo.startsWith('/')
        && !returnTo.startsWith('//')
        ? returnTo
        : '/';
      navigate(destination, { replace: true });
    } catch (err) {
      error(err.message ?? 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePassword = () => setShowPassword((s) => !s);

  return (
    <div className="max-w-md">
      <h2 className="text-3xl font-display font-700 text-center mb-8">Log in</h2>

      <form onSubmit={handleSubmit} className="bg-paper rounded-lg p-8 shadow-sm">
        <div className="mb-4">
          <label htmlFor="login-email" className="block text-sm text-brown mb-2">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border line p-3"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="login-password" className="block text-sm text-brown mb-2">Password</label>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded border line p-3"
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={togglePassword}
              className={cx('text-orange', 'hover:text-orange-dark', 'underline', 'cursor-pointer', 'py-1', 'px-2', 'rounded', 'text-sm')}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" loading={submitting}>
          Log in
        </Button>

        <p className="text-center mt-6 text-sm text-brown-line">
          Don't have an account? <a href="/register" className="text-orange underline">Register</a>
        </p>
      </form>
    </div>
  );
}
