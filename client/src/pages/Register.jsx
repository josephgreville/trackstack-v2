import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button.jsx';
import { IconUser, IconMail, IconLock } from '../components/Icons.jsx';
import { fadeInUp } from '../components/motion.jsx';

const SOCIALS = [
  { name: 'Instagram', color: '#E1306C', glyph: 'camera' },
  { name: 'Facebook', color: '#1877F2', glyph: 'f' },
  { name: 'LinkedIn', color: '#0A66C2', glyph: 'in' },
  { name: 'X', color: '#000000', glyph: 'x' },
];

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
    <div className="auth-form-shell" variants={fadeInUp} initial="hidden" animate="show">
      <h2 className="auth-title">Registration</h2>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <div className="auth-field-icon">
            <IconUser size={16} />
          </div>
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

        <div className="auth-field">
          <div className="auth-field-icon">
            <IconMail size={16} />
          </div>
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
          <div className="auth-field-icon">
            <IconLock size={16} />
          </div>
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
        <div className="auth-field">
          <div className="auth-field-icon">
            <IconLock size={16} filled />
          </div>
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

        <Button type="submit" className="auth-submit" loading={submitting} size="lg">
          Sign up
        </Button>

        <p className="auth-alternate">
          Already have an account? <Link to="/login">Click here to login</Link>
        </p>

        <div className="auth-divider">
          <span>Or</span>
        </div>

        <p className="auth-social-caption">Sign up with social platforms</p>
        <div className="auth-socials">
          {SOCIALS.map((social) => (
            <motion.button
              key={social.name}
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              className="auth-social"
              style={{ borderColor: social.color, color: social.color }}
              title={social.name}
              aria-label={`Sign up with ${social.name}`}
            >
              <span className="auth-social-glyph">{social.glyph}</span>
            </motion.button>
          ))}
        </div>
      </form>
    </div>
  );
}
