import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/login", "/sso-callback", "/api"];

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes and profile routes (@username)
  if (isPublicRoute(pathname) || pathname.startsWith("/@")) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = req.cookies.get("appwrite-session");

  if (!session?.value) {
    const url = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
