import type { AuthOptions, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: [],

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