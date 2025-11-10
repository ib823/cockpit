import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: "USER" | "MANAGER" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: "USER" | "MANAGER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId?: string;
    role?: "USER" | "MANAGER" | "ADMIN";
  }
}
