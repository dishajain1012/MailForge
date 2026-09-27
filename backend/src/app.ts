import express, { Express } from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport';
import { config } from './config';
import routes from './routes';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';

const app: Express = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all local / dev origins with credentials
      callback(null, origin || true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Session & Passport
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

import authRoutes from './routes/auth.routes';

// API Routes
app.use('/api', routes);
app.use('/auth', authRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ReachInbox Email Job Scheduler API',
    status: 'running',
    healthCheck: '/api/health',
  });
});

// Global Error Middleware
app.use(errorHandler);

export default app;
