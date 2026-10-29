import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { cx } from '../utils/format';
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
    <div className="max-w-md">
      <h2 className="text-3xl font-display font-700 text-center mb-8">Sign up</h2>

      <form onSubmit={handleSubmit} className="bg-paper rounded-lg p-8 shadow-sm">
        <div className="mb-4">
          <div>
            <label htmlFor="register-username" className="block text-sm text-brown mb-2">Username</label>
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded border line p-3"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="register-email" className="block text-sm text-brown mb-2">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border line p-3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="register-password" className="block text-sm text-brown mb-2">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded border line p-3"
            />
          </div>
          <div>
            <label htmlFor="register-confirm-password" className="block text-sm text-brown mb-2">Confirm password</label>
            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded border line p-3"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" loading={submitting}>
          Create account
        </Button>

        <p className="text-center mt-6 text-sm text-brown-line">
          Already have an account? <a href="/login" className="text-orange underline">Log in</a>
        </p>
      </form>
    </div>
  );
}