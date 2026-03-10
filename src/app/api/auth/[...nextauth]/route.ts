import NextAuth from "next-auth";
import { authOptions } from "@/server/auth";
import type { NextRequest } from "next/server";

const handler = (req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) => 
  NextAuth(req as unknown as any, ctx as unknown as any, authOptions);

export { handler as GET, handler as POST };
