import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn.js';
import Button from '../components/Button.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import { IconUser, IconMail, IconLock } from '../components/Icons.jsx';
import { fadeInUp } from '../components/motion.jsx';
import { fieldErrorsFrom, messageFrom, validateRegister } from '../utils/authErrors.js';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { register } = useAuth();
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

    const localErrors = validateRegister({ username, email, password, confirmPassword });
    setFieldErrors(localErrors);
    setFormError('');

    if (Object.keys(localErrors).length > 0) {
      error(Object.values(localErrors)[0] ?? 'Check the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({ username, email, password });
      success(`Welcome, ${user.username}! Your account has been created.`);
      navigate('/', { replace: true });
    } catch (err) {
      const details = fieldErrorsFrom(err);
      const message = messageFrom(err, 'Registration failed. Check your details and try again.');
      setFieldErrors(details);
      setFormError(message);
      error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldProps = (field) => ({
    'aria-invalid': Boolean(fieldErrors[field]),
    'aria-describedby': fieldErrors[field] ? `register-${field}-error` : undefined,
  });

  return (
    <div className="auth-form-shell" variants={fadeInUp} initial="hidden" animate="show">
      <h2 className="auth-title">Registration</h2>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="auth-field">
          <div className="auth-input-wrap">
            <div className="auth-field-icon">
              <IconUser size={16} />
            </div>
            <label htmlFor="register-username" className="sr-only">Username</label>
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError('username');
              }}
              required
              placeholder="Username"
              autoComplete="username"
              className="auth-input"
              {...fieldProps('username')}
            />
          </div>
          {fieldErrors.username && (
            <p id="register-username-error" className="auth-field-error" role="alert">
              {fieldErrors.username}
            </p>
          )}
        </div>

        <div className="auth-field">
          <div className="auth-input-wrap">
            <div className="auth-field-icon">
              <IconMail size={16} />
            </div>
            <label htmlFor="register-email" className="sr-only">Email</label>
            <input
              id="register-email"
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
              {...fieldProps('email')}
            />
          </div>
          {fieldErrors.email && (
            <p id="register-email-error" className="auth-field-error" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="auth-field">
          <div className="auth-input-wrap">
            <div className="auth-field-icon">
              <IconLock size={16} />
            </div>
            <label htmlFor="register-password" className="sr-only">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
                clearFieldError('confirmPassword');
              }}
              required
              minLength={8}
              placeholder="Password"
              autoComplete="new-password"
              className="auth-input"
              {...fieldProps('password')}
            />
          </div>
          {fieldErrors.password && (
            <p id="register-password-error" className="auth-field-error" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div className="auth-field">
          <div className="auth-input-wrap">
            <div className="auth-field-icon">
              <IconLock size={16} filled />
            </div>
            <label htmlFor="register-confirm-password" className="sr-only">Confirm password</label>
            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError('confirmPassword');
              }}
              required
              minLength={8}
              placeholder="Confirm password"
              autoComplete="new-password"
              className="auth-input"
              {...fieldProps('confirmPassword')}
            />
          </div>
          {fieldErrors.confirmPassword && (
            <p id="register-confirmPassword-error" className="auth-field-error" role="alert">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        {formError && <p className="auth-form-error" role="alert">{formError}</p>}

        <Button type="submit" className="auth-submit" loading={submitting} size="lg">
          Sign up
        </Button>

        <p className="auth-alternate">
          Already have an account? <Link to="/login">Click here to login</Link>
        </p>

        {googleAvailable && (
          <div className="auth-google-wrap">
            <div className="auth-divider">
              <span>Or</span>
            </div>
            <p className="auth-social-caption">Continue with Google</p>
            <GoogleButton label="Sign up with Google" />
          </div>
        )}
      </form>
    </div>
  );
}
