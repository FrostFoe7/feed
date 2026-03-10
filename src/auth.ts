import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/appwrite/db";
import { ID } from "@/lib/appwrite/server";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        username: { label: "Username", type: "text" },
        mode: { label: "Mode", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const mode = (credentials.mode as string) || "login";

        if (mode === "register") {
          const existingUser = await getUserByEmail(credentials.email as string);
          if (existingUser) {
            throw new Error("An account with this email already exists.");
          }

          const userId = ID.unique();
          const username = (credentials.username as string) || (credentials.email as string).split("@")[0] || "user";
          const hashedPassword = await bcrypt.hash(credentials.password as string, 10);

          try {
            await createUser({
              id: userId,
              email: credentials.email as string,
              username,
              fullname: username,
              password: hashedPassword,
              image: null,
              verified: false,
            });
          } catch (e) {
            console.error("Database Create User Error:", e);
            return null;
          }

          return {
            id: userId,
            email: credentials.email as string,
            name: username,
          };
        }

        try {
          const user = await getUserByEmail(credentials.email as string);
          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password,
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.$id,
            email: user.email,
            name: user.username,
          };
        } catch (e) {
          console.error("Manual Login Error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google") {
          if (!user.email) return false;

          const existingUser = await getUserByEmail(user.email);
          if (!existingUser) {
            const username =
              user.name?.replace(/\s+/g, "").toLowerCase() ||
              user.email.split("@")[0] ||
              "user";
            await createUser({
              id: ID.unique(),
              email: user.email,
              username,
              fullname: user.name || username,
              image: user.image || null,
              verified: false,
            });
          }
        }
        return true;
      } catch (e) {
        console.error("NextAuth signIn callback error:", e);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
