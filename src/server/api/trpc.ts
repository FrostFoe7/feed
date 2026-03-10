/* eslint-disable @typescript-eslint/no-explicit-any */
import { TRPCError, initTRPC } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getServerAuthSession } from "@/server/auth";

export const createTRPCContext = async (opts: { req: NextRequest }) => {
  const session = await getServerAuthSession();
  return {
    headers: opts.req.headers,
    session,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const middleware = t.middleware;

const isAuth = middleware(async (opts) => {
  if (!opts.ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx: {
      userId: (opts.ctx.session.user as any).id,
      user: opts.ctx.session.user,
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(isAuth);
