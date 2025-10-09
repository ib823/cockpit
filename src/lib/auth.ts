import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

export const authConfig = {
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!user) return null;
        // optional ADMIN bootstrap via env hash
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && creds.email === process.env.ADMIN_EMAIL) {
          const ok = await compare(creds.password, process.env.ADMIN_PASSWORD_HASH!);
          if (ok) return { id: user.id, email: user.email, name: user.name };
        }
        // otherwise require existing hashed password on User (if you store it)
        // return null to prevent login when not configured
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) (session as any).userId = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
