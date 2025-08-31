import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (creds) => {
        const username = creds?.username?.toString() || "";
        const password = creds?.password?.toString() || "";
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.hashedPassword);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.displayName,
          email: user.email ?? null,
          username: user.username,
          staffRole: user.staffRole,
          bizRole: user.bizRole,
          businessId: user.businessId,
          mustChangePassword: user.mustChangePassword,
          mustAddStateId: user.mustAddStateId,
          stateId: user.stateId ?? null
        } as any;
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.staffRole = (user as any).staffRole || null;
        token.bizRole = (user as any).bizRole || null;
        token.businessId = (user as any).businessId || null;
        token.username = (user as any).username || null;
        token.mustChangePassword = (user as any).mustChangePassword || false;
        token.mustAddStateId = (user as any).mustAddStateId || false;
        token.stateId = (user as any).stateId || null;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).staffRole = token.staffRole;
      (session as any).bizRole = token.bizRole;
      (session as any).businessId = token.businessId;
      (session as any).username = token.username;
      (session as any).mustChangePassword = token.mustChangePassword;
      (session as any).mustAddStateId = token.mustAddStateId;
      (session as any).stateId = token.stateId;
      return session;
    }
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);