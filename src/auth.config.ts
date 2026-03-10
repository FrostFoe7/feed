import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
      
      // Allow auth pages for non-logged in users, but redirect logged in users away
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      // Default behavior: allow access to all other pages
      // You can tighten this up later for specific protected routes
      return true;
    },
  },
  providers: [], // Providers are added in auth.ts
} satisfies NextAuthConfig;
