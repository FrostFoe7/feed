/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail, createUser } from "@/lib/appwrite/db";
import { ID, createAdminClient } from "@/lib/appwrite/server";

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
        const { account } = createAdminClient();

        if (mode === "register") {
          const existingUser = await getUserByEmail(credentials.email);
          if (existingUser) {
            throw new Error("User already exists");
          }

          const userId = ID.unique();
          const username = credentials.username || credentials.email.split("@")[0] || "user";

          // 1. Create user in Appwrite Auth
          await account.create(userId, credentials.email, credentials.password, username);

          // 2. Create user in Appwrite Database
          await createUser({
            id: userId,
            email: credentials.email,
            username,
            fullname: username,
            image: null,
            verified: false,
          });

          // 3. Create a session to get the secret
          const session = await account.createEmailPasswordSession(
            credentials.email,
            credentials.password
          );

          return {
            id: userId,
            email: credentials.email,
            name: username,
            secret: session.secret,
          };
        }

        // Login flow
        try {
          const session = await account.createEmailPasswordSession(
            credentials.email,
            credentials.password
          );
          
          const user = await getUserByEmail(credentials.email);
          if (!user) {
            throw new Error("User document not found");
          }

          return {
            id: user.$id,
            email: user.email,
            name: user.username,
            secret: session.secret,
          };
        } catch {
          throw new Error("Invalid credentials");
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
          const username = user.name?.replace(/\s+/g, "").toLowerCase() || user.email.split("@")[0] || "user";
          await createUser({
            id: ID.unique(),
            email: user.email,
            username,
            fullname: user.name || username,
            image: user.image || null,
            verified: true,
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.secret = (user as any).secret || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).secret = token.secret;
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
