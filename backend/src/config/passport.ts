import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from './index';
import { prisma } from './db';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        const avatarUrl = profile.photos?.[0].value;
        const name = profile.displayName;

        // Find or create the user securely in PostgreSQL
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name,
              googleId: profile.id,
              avatarUrl,
            },
          });
        } else if (!user.googleId) {
          // If the user existed without a googleId (e.g., from an earlier test), link it
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: profile.id,
              avatarUrl: user.avatarUrl || avatarUrl,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user ID to session
passport.serializeUser((user: { id?: string }, done) => {
  done(null, user.id);
});

// Deserialize user from session ID
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
