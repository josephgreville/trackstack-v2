import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
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
router.post('/logout', asyncHandler(logout));
router.get('/me', asyncHandler(me));
router.patch('/profile', requireAuth, validate({ body: profileUpdateSchema }), asyncHandler(async (req, res) => {
  await setProfileVisibility(req.user.id, req.validated.body.profilePublic);
  res.json({ profilePublic: req.validated.body.profilePublic });
}));

export default router;
