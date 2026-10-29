import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { cx } from '../utils/format';
import { authService } from '../services/index';
import Button from '../components/Button.jsx';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }
    try {
      const user = await authService.register({ username, email, password });
      success(`Welcome, ${user.username}! Your account has been created.`);
      navigate('/', { replace: true });
    } catch (err) {
      error(err.message ?? 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-3xl font-display font-700 text-center mb-8">Sign up</h2>

      <form onSubmit={handleSubmit} className="bg-paper rounded-lg p-8 shadow-sm">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-brown mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border line p-3"
            />
          </div>
          <div>
            <label className="block text-sm text-brown mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded border line p-3"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-brown mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border line p-3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-brown mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded border line p-3"
            />
          </div>
          <div>
            <label className="block text-sm text-brown mb-2">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded border line p-3"
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Create account
        </Button>

        <p className="text-center mt-6 text-sm text-brown-line">
          Already have an account? <a href="/login" className="text-orange underline">Log in</a>
        </p>
      </form>
    </div>
  );
}