import { pool } from '../db/pool.js';
import { UnauthorizedError } from '../utils/errors.js';
import { toPublicUser } from '../services/authService.js';

export async function requireAuth(req, _res, next) {
  try {
    const userId = req.session?.userId;
    if (!userId) throw new UnauthorizedError();

    const { rows } = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [userId],
    );

    if (!rows[0]) {
      req.session.destroy(() => {});
      throw new UnauthorizedError();
    }

    req.user = toPublicUser(rows[0]);
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalUser(req, _res, next) {
  try {
    const userId = req.session?.userId;
    if (!userId) return next();

    const { rows } = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [userId],
    );
    if (rows[0]) req.user = toPublicUser(rows[0]);
    return next();
  } catch (error) {
    return next(error);
  }
}
