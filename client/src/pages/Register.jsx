import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button.jsx';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (password !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await register({ username, email, password });
      success(`Welcome, ${user.username}! Your account has been created.`);
      navigate('/', { replace: true });
    } catch (err) {
      error(err.message ?? 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-form-shell">
      <h2 className="auth-title">Registration</h2>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <div>
            <label htmlFor="register-username" className="sr-only">Username</label>
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Username"
              autoComplete="username"
              className="auth-input"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="register-email" className="sr-only">Email</label>
          <input
            id="register-email"
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
          <div>
            <label htmlFor="register-password" className="sr-only">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Password"
              autoComplete="new-password"
              className="auth-input"
            />
          </div>
        </div>
        <div className="auth-field">
          <div>
            <label htmlFor="register-confirm-password" className="sr-only">Confirm password</label>
            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Confirm password"
              autoComplete="new-password"
              className="auth-input"
            />
          </div>
        </div>

        <Button type="submit" className="auth-submit" loading={submitting}>
          Sign up
        </Button>

        <p className="auth-alternate">
          Already have an account? <Link to="/login">Click here to login</Link>
        </p>
      </form>
    </div>
  );
}
