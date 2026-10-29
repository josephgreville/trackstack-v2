import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import { pool } from './db/pool.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { ForbiddenError } from './utils/errors.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(HERE, '..', '..', 'client', 'dist');
const PgStore = connectPgSimple(session);

function isLocalDevelopmentOrigin(origin) {
  if (env.isProduction) return false;
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === 'http:'
      && ['localhost', '127.0.0.1', '[::1]'].includes(hostname.toLowerCase());
  } catch {
    return false;
  }
}

function isAllowedOrigin(req, origin) {
  if (!origin) return true;
  if (env.clientOrigins.includes(origin)) return true;
  if (isLocalDevelopmentOrigin(origin)) return true;
  const ownOrigin = `${req.protocol}://${req.get('host')}`;
  return origin === ownOrigin;
}

export function createApp() {
  const app = express();

  if (env.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'https://*.mzstatic.com'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Reject cross-site writes before they can touch a session. SameSite=Lax
  // cookies are the second line of defence.
  app.use((req, _res, next) => {
    const origin = req.get('origin');
    if (origin && !isAllowedOrigin(req, origin)) {
      return next(new ForbiddenError('That origin is not allowed to access TrackStack.'));
    }
    return next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        return callback(null, env.clientOrigins.includes(origin) || isLocalDevelopmentOrigin(origin));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
    }),
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());

  app.use(
    session({
      name: 'ts.sid',
      secret: env.sessionSecret,
      store: new PgStore({
        pool,
        tableName: 'sessions',
        createTableIfMissing: false,
        pruneSessionInterval: 60 * 15,
      }),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.cookieSecure,
        maxAge: env.sessionMaxAgeMs,
        path: '/',
      },
    }),
  );

  app.use('/api', apiLimiter);
  app.use('/api/v1', apiRoutes);

  if (env.isProduction) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
