import { Router } from 'express';
import {
  googleCallback,
  googleSignIn,
  googleStatus,
  login,
  logout,
  me,
  register,
} from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { setProfileVisibility } from '../services/personalFeaturesService.js';
import { profileUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), asyncHandler(register));
router.post('/login', authLimiter, validate({ body: loginSchema }), asyncHandler(login));
router.get('/google/status', asyncHandler(googleStatus));
router.get('/google', authLimiter, asyncHandler(googleSignIn));
router.get('/google/callback', authLimiter, asyncHandler(googleCallback));
router.post('/logout', asyncHandler(logout));
router.get('/me', asyncHandler(me));
router.patch('/profile', requireAuth, validate({ body: profileUpdateSchema }), asyncHandler(async (req, res) => {
  await setProfileVisibility(req.user.id, req.validated.body.profilePublic);
  res.json({ profilePublic: req.validated.body.profilePublic });
}));

export default router;
