/**
 * NextAuth Configuration
 * Unified authentication system for the application
 * Supports credentials (admin bootstrap) and passkey authentication
 */

import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import NextAuth from 'next-auth';
import type { AuthOptions, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

export const authConfig = {
  // JWT strategy (stateless sessions)
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 }, // 24 hours

  // Prisma adapter for user/account management
  adapter: PrismaAdapter(prisma),

  // Authentication providers
  providers: [
    // Credentials provider for admin bootstrap and testing
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Find user in database
        const user = await prisma.users.findUnique({
          where: { email }
        });

        if (!user) {
          return null;
        }

        // Admin bootstrap: Check env var password hash
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH &&
            email === process.env.ADMIN_EMAIL) {
          const isValid = await compare(password, process.env.ADMIN_PASSWORD_HASH);
          if (isValid) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
        }

        // For other users, password authentication is not supported
        // (use passkeys or magic links instead)
        return null;
      },
    }),

    // Passkey provider (credential verification happens in separate API routes)
    Credentials({
      id: 'webauthn',
      name: 'Passkey',
      credentials: {
        email: { label: 'Email', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        // Passkey verification already done by WebAuthn API routes
        // This just fetches the user to create a session
        const user = await prisma.users.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user) {
          return null;
        }

        // Check if user's access has expired
        const isExpired = !user.exception && user.accessExpiresAt &&
                         user.accessExpiresAt <= new Date();
        if (isExpired) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  // Callbacks for session management
  callbacks: {
    // Add user info to JWT token
    async jwt({ token, user, trigger }: { token: JWT; user?: User; trigger?: string }) {
      // Initial sign in - add user data to token
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.role = user.role || 'USER';
      }

      // Update trigger - refresh user data from DB
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

    // Add JWT data to session object
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

  // Custom pages
  pages: {
    signIn: '/login',
    error: '/login',
  },

  // Enable debug logging in development
  debug: process.env.NODE_ENV === 'development',
} satisfies AuthOptions;
