import { motion } from 'framer-motion';
import { getApiBase } from '../api/client.js';

export default function GoogleButton({ label }) {
  return (
    <motion.a
      className="auth-google"
      href={`${getApiBase()}/auth/google`}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
    >
      <span className="auth-google-glyph" aria-hidden="true">G</span>
      <span>{label}</span>
    </motion.a>
  );
}
