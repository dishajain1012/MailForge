import express, { Express } from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport';
import { config } from './config';
import routes from './routes';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';

const app: Express = express();

// Middleware
app.use(cors({ origin: config.clientUrl, credentials: true }));
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
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api', routes);

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
