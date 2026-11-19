import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn.js';
import Button from '../components/Button.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import { IconUser, IconLock, IconMail, IconEye, IconEyeOff } from '../components/Icons.jsx';
import { fadeInUp } from '../components/motion.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();
  const { login } = useAuth();
  const googleAvailable = useGoogleSignIn();

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
    <div className="auth-form-shell" variants={fadeInUp} initial="hidden" animate="show">
      <h2 className="auth-title">Log in</h2>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <div className="auth-field-icon">
            <IconMail size={16} />
          </div>
          <label htmlFor="login-email" className="sr-only">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email address"
            autoComplete="email"
            className="auth-input"
          />
        </div>

        <div className="auth-field">
          <div className="auth-field-icon">
            <IconLock size={16} />
          </div>
          <label htmlFor="login-password" className="sr-only">Password</label>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
            autoComplete="current-password"
            className="auth-input"
          />
          <button
            type="button"
            onClick={togglePassword}
            className="auth-password-toggle"
            aria-label={showPassword ? 'Hide' : 'Show'}
          >
            {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          </button>
        </div>

        <Button type="submit" className="auth-submit" loading={submitting} size="lg">
          Log in
        </Button>

        <p className="auth-alternate">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>

        {googleAvailable && (
          <div className="auth-google-wrap">
            <div className="auth-divider">
              <span>Or</span>
            </div>
            <p className="auth-social-caption">Continue with Google</p>
            <GoogleButton label="Log in with Google" />
          </div>
        )}
      </form>
    </div>
  );
}
