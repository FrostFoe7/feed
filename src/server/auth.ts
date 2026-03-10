/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/appwrite/db";
import { ID } from "@/lib/appwrite/server";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        username: { label: "Username", type: "text" },
        mode: { label: "Mode", type: "text" }, // "login" or "register"
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const mode = credentials.mode || "login";

        if (mode === "register") {
          // 1. Check if user exists in Database (manual collection)
          const existingUser = await getUserByEmail(credentials.email);
          if (existingUser) {
            throw new Error(
              "An account with this email already exists. Please log in.",
            );
          }

          const userId = ID.unique();
          const username =
            credentials.username || credentials.email.split("@")[0] || "user";
          const hashedPassword = await bcrypt.hash(credentials.password, 10);

          // 2. Create user document in Appwrite Database ONLY
          try {
            await createUser({
              id: userId,
              email: credentials.email,
              username,
              fullname: username,
              password: hashedPassword,
              image: null,
              verified: false,
            });
          } catch (e: any) {
            console.error("Database Create User Error:", e);
            throw new Error(e.message || "Failed to create user record");
          }

          return {
            id: userId,
            email: credentials.email,
            name: username,
          };
        }

        // Login flow
        try {
          // 1. Fetch user from Database collection
          const user = await getUserByEmail(credentials.email);
          if (!user || !user.password) {
            throw new Error("Invalid email or password");
          }

          // 2. Compare hashed password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.$id,
            email: user.email,
            name: user.username,
          };
        } catch (e: any) {
          console.error("Manual Login Error:", e);
          throw new Error(e.message || "Invalid credentials");
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
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
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const getServerAuthSession = () => getServerSession(authOptions);
