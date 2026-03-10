import NextAuth from "next-auth";
import { authOptions } from "@/server/auth";
import { NextRequest } from "next/server";

const handler = (req: NextRequest, ctx: any) => NextAuth(req, ctx, authOptions);

export { handler as GET, handler as POST };
