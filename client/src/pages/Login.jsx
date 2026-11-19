import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn.js';
import Button from '../components/Button.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import { IconLock, IconMail, IconEye, IconEyeOff } from '../components/Icons.jsx';
import { fadeInUp } from '../components/motion.jsx';
import { fieldErrorsFrom, messageFrom, validateLogin } from '../utils/authErrors.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();
  const { login } = useAuth();
  const googleAvailable = useGoogleSignIn();

  const clearFieldError = (field) => {
    setFormError('');
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const localErrors = validateLogin({ email, password });
    setFieldErrors(localErrors);
    setFormError('');

    if (Object.keys(localErrors).length > 0) {
      error(Object.values(localErrors)[0] ?? 'Check the highlighted fields.');
      return;
    }

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
      const details = fieldErrorsFrom(err);
      const message = messageFrom(err, 'Login failed. Check your details and try again.');
      setFieldErrors(details);
      setFormError(message);
      error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePassword = () => setShowPassword((s) => !s);

  return (
    <div className="auth-form-shell" variants={fadeInUp} initial="hidden" animate="show">
      <h2 className="auth-title">Log in</h2>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="auth-field">
          <div className="auth-input-wrap">
            <div className="auth-field-icon">
              <IconMail size={16} />
            </div>
            <label htmlFor="login-email" className="sr-only">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
              required
              placeholder="Email address"
              autoComplete="email"
              className="auth-input"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            />
          </div>
          {fieldErrors.email && (
            <p id="login-email-error" className="auth-field-error" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="auth-field">
          <div className="auth-input-wrap">
            <div className="auth-field-icon">
              <IconLock size={16} />
            </div>
            <label htmlFor="login-password" className="sr-only">Password</label>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              required
              placeholder="Password"
              autoComplete="current-password"
              className="auth-input"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
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
          {fieldErrors.password && (
            <p id="login-password-error" className="auth-field-error" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {formError && <p className="auth-form-error" role="alert">{formError}</p>}

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
