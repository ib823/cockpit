import { compare } from 'bcryptjs';
import type { AuthOptions, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database', maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('[AUTH DEBUG] authorize called with:', {
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password,
          email: credentials?.email,
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH DEBUG] Missing credentials');
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.users.findUnique({
          where: { email }
        });

        console.log('[AUTH DEBUG] User lookup:', {
          email,
          found: !!user,
          role: user?.role,
        });

        if (!user) {
          console.log('[AUTH DEBUG] User not found');
          return null;
        }

        // Check EmailApproval table for 6-digit code
        const emailApproval = await prisma.emailApproval.findUnique({
          where: { email }
        });

        console.log('[AUTH DEBUG] EmailApproval check:', {
          found: !!emailApproval,
          expired: emailApproval ? emailApproval.tokenExpiresAt < new Date() : null
        });

        if (emailApproval && emailApproval.tokenExpiresAt > new Date()) {
          const isValid = await compare(password, emailApproval.tokenHash);
          console.log('[AUTH DEBUG] Code valid:', isValid);

          if (isValid) {
            console.log('[AUTH DEBUG] Login successful via EmailApproval!');
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
        }

        // Fallback: Check env var (legacy)
        if (process.env.ADMIN_PASSWORD_HASH && 
            email === process.env.ADMIN_EMAIL) {
          const isValid = await compare(password, process.env.ADMIN_PASSWORD_HASH);
          if (isValid) {
            console.log('[AUTH DEBUG] Login successful via env var!');
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
        }

        console.log('[AUTH DEBUG] Login failed - no valid auth method');
        return null;
      },
    }),

    Credentials({
      id: 'webauthn',
      name: 'Passkey',
      credentials: {
        email: { label: 'Email', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const user = await prisma.users.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user) return null;

        const isExpired = !user.exception && user.accessExpiresAt &&
                         user.accessExpiresAt <= new Date();
        if (isExpired) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }: { token: JWT; user?: User; trigger?: string }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.role = user.role || 'USER';
      }

      if (trigger === 'update') {
        const dbUser = await prisma.users.findUnique({
          where: { id: token.userId as string }
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.email = dbUser.email;
        }
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.userId as string,
          email: token.email as string,
          role: token.role as 'USER' | 'MANAGER' | 'ADMIN',
        };
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  debug: process.env.NODE_ENV === 'development',
} satisfies AuthOptions;