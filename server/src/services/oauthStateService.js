import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import env from '../config/env.js';

export const OAUTH_STATE_COOKIE = 'ts.oauth_state';
const STATE_AGE_MS = 10 * 60 * 1000;

function sign(state) {
  return createHmac('sha256', env.sessionSecret).update(state).digest('base64url');
}

export function oauthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure,
    maxAge: STATE_AGE_MS,
    path: '/',
  };
}

export function createOAuthState() {
  const state = randomBytes(32).toString('base64url');
  return { state, cookieValue: `${state}.${sign(state)}` };
}

export function verifyOAuthState(state, cookieValue) {
  if (typeof state !== 'string' || typeof cookieValue !== 'string') return false;
  const separator = cookieValue.indexOf('.');
  if (separator === -1) return false;

  const stateFromCookie = cookieValue.slice(0, separator);
  const signature = Buffer.from(cookieValue.slice(separator + 1));
  const expected = Buffer.from(sign(state));

  if (stateFromCookie !== state) return false;
  return signature.length === expected.length && timingSafeEqual(signature, expected);
}
