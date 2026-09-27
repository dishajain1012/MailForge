import { Router, Request, Response } from 'express';
import passport from 'passport';
import { config } from '../config';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// 1. Initialize Google OAuth flow
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// 2. Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${config.clientUrl}/login?error=auth_failed`,
  }),
  (req: Request, res: Response) => {
    // Successful authentication, redirect to frontend dashboard
    res.redirect(`${config.clientUrl}/dashboard`);
  }
);

// 3. Logout
router.post('/logout', (req: Request, res: Response, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // Default session cookie name
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

// 4. Get authenticated user data
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
      avatarUrl: req.user?.avatarUrl,
    }
  });
});

export default router;
