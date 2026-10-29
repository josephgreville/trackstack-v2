import { authenticateUser, findUserById, registerUser } from '../services/authService.js';

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
