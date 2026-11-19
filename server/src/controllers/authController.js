import env from '../config/env.js';
import { authenticateUser, findUserById, registerUser } from '../services/authService.js';
import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  fetchGoogleProfile,
  findOrCreateGoogleUser,
  isGoogleConfigured,
} from '../services/googleAuthService.js';
import {
  OAUTH_STATE_COOKIE,
  createOAuthState,
  oauthCookieOptions,
  verifyOAuthState,
} from '../services/oauthStateService.js';

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

async function startSession(req, user) {
  await regenerateSession(req);
  req.session.userId = user.id;
  await saveSession(req);
}

function authRedirect(path, notice) {
  const url = new URL(path, env.publicUrl);
  url.searchParams.set('auth', notice);
  return url.toString();
}

export async function googleStatus(_req, res) {
  res.json({ configured: isGoogleConfigured() });
}

export async function googleSignIn(_req, res) {
  if (!isGoogleConfigured()) {
    return res.status(503).json({
      error: {
        code: 'OAUTH_NOT_CONFIGURED',
        message: 'Google sign-in is not configured yet.',
      },
    });
  }

  const { state, cookieValue } = createOAuthState();
  res.cookie(OAUTH_STATE_COOKIE, cookieValue, oauthCookieOptions());
  return res.redirect(buildGoogleAuthUrl(state));
}

export async function googleCallback(req, res) {
  const { code, state, error: providerError } = req.query;
  const stateCookie = req.cookies?.[OAUTH_STATE_COOKIE];
  res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });

  if (providerError === 'access_denied' || providerError === 'user_denied') {
    return res.redirect(authRedirect('/login', 'google_cancelled'));
  }
  if (!code || !verifyOAuthState(state, stateCookie)) {
    return res.redirect(authRedirect('/login', 'google_error'));
  }

  try {
    const accessToken = await exchangeGoogleCode(code);
    const profile = await fetchGoogleProfile(accessToken);
    const user = await findOrCreateGoogleUser(profile);
    await startSession(req, user);
    return res.redirect(authRedirect('/', 'google_success'));
  } catch (caught) {
    if (caught.status === 401) {
      return res.redirect(authRedirect('/login', 'google_unverified'));
    }
    console.error('Google sign-in failed:', caught);
    return res.redirect(authRedirect('/login', 'google_error'));
  }
}

export async function register(req, res) {
  const user = await registerUser(req.validated.body);
  await startSession(req, user);
  res.status(201).json({ user });
}

export async function login(req, res) {
  const user = await authenticateUser(req.validated.body);
  await startSession(req, user);
  res.json({ user });
}

export async function logout(req, res) {
  await new Promise((resolve) => {
    if (!req.session) return resolve();
    req.session.destroy(() => resolve());
  });
  res.clearCookie('ts.sid', { path: '/' });
  res.status(204).end();
}

export async function me(req, res) {
  if (!req.session?.userId) return res.json({ user: null });
  const user = await findUserById(req.session.userId);
  if (!user) return res.json({ user: null });
  return res.json({ user });
}
