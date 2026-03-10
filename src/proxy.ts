import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/login", "/register", "/api"];

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

export default auth(async function proxy(req) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Allow public routes and profile routes (@username)
  if (
    isPublicRoute(pathname) ||
    pathname.startsWith("/@") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
