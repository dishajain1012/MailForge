import { Router, Request, Response } from 'express';
import passport from 'passport';
import { config } from '../config';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../config/db';

const router = Router();

// Mock / Fallback Google Login Handler
const handleMockGoogleLogin = async (req: Request, res: Response, next: any) => {
  try {
    const targetEmail = 'google.user@mailforge.com';
    const targetName = 'Google Demo User';

    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: targetEmail,
          name: targetName,
          googleId: 'google-demo-id-12345',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleUser',
        },
      });
    }

    req.login(user, (err) => {
      if (err) return next(err);
      req.session.save(() => {
        res.redirect(`${config.clientUrl.replace(/\/$/, '')}/dashboard`);
      });
    });
  } catch (error) {
    next(error);
  }
};

// 1. Initialize Google OAuth flow
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    req.session.save(() => {
      res.redirect(`${config.clientUrl.replace(/\/$/, '')}/dashboard`);
    });
  }
);

// 3. Direct / Demo Login (Email & Password or 1-Click Demo)
const handleDirectLogin = async (req: Request, res: Response, next: any) => {
  try {
    const { email, name } = req.body;
    const targetEmail = (email && typeof email === 'string' && email.trim()) ? email.trim() : 'demo@mailforge.com';
    const targetName = (name && typeof name === 'string' && name.trim()) ? name.trim() : targetEmail.split('@')[0];

    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: targetEmail,
          name: targetName,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetName)}`,
        },
      });
    }

    req.login(user, (err) => {
      if (err) return next(err);
      req.session.save(() => {
        res.json({
          success: true,
          data: {
            id: user!.id,
            email: user!.email,
            name: user!.name,
            avatarUrl: user!.avatarUrl,
          },
        });
      });
    });
  } catch (error) {
    next(error);
  }
};

router.post('/login', handleDirectLogin);
router.post('/demo', handleDirectLogin);

// 4. Logout
router.post('/logout', (req: Request, res: Response, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid', {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        httpOnly: true,
      });
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

// 5. Get authenticated user data
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

