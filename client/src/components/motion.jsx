/* Shared animation primitives for TrackStack.
 * Import these from framer-motion to keep pages, lists, cards and toasts
 * moving consistently across the app.
 */
import { motion, AnimatePresence } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Route / page transitions                                          */
/* ------------------------------------------------------------------ */

export const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const PageTransition = ({ children }) => (
  <AnimatePresence mode="wait">
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="page-wrap"
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

/* ------------------------------------------------------------------ */
/*  Staggered lists                                                   */
/* ------------------------------------------------------------------ */

export const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.055, delayChildren: 0.08 },
  },
};

export const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 340, damping: 26 },
  },
};

/* ------------------------------------------------------------------ */
/*  Hover / tap card feel                                             */
/* ------------------------------------------------------------------ */

export const hoverCard = {
  whileHover: { y: -6, scale: 1.015 },
  whileTap: { scale: 0.985 },
  transition: { type: 'spring', stiffness: 360, damping: 24 },
};

export const hoverImage = {
  whileHover: { scale: 1.05 },
  transition: { type: 'spring', stiffness: 400, damping: 28 },
};

/* ------------------------------------------------------------------ */
/*  Simple fades                                                      */
/* ------------------------------------------------------------------ */

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut' },
};

/* ------------------------------------------------------------------ */
/*  Toast slide                                                       */
/* ------------------------------------------------------------------ */

export const toastVariant = {
  hidden: { opacity: 0, x: 40, scale: 0.95 },
  show: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 40, scale: 0.95 },
  transition: { type: 'spring', stiffness: 400, damping: 26 },
};

/* ------------------------------------------------------------------ */
/*  Play / pulse loop (for the player)                                */
/* ------------------------------------------------------------------ */

export const playPulse = {
  animate: { scale: [1, 1.06, 1] },
  transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
};

export const spin = {
  animate: { rotate: 360 },
  transition: { duration: 1.2, repeat: Infinity, ease: 'linear' },
};

export { AnimatePresence, motion };
