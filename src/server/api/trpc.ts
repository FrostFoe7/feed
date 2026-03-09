import { TRPCError, initTRPC } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { createSessionClient } from "@/lib/appwrite/server";

interface CreateContextOptions {
  headers: Headers;
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    headers: opts.headers,
  };
};

export const createTRPCContext = (opts: { req: NextRequest }) => {
  return createInnerTRPCContext({
    headers: opts.req.headers,
  });
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
  const sessionCookie = opts.ctx.headers.get("cookie") ?? "";
  const sessionMatch = sessionCookie.match(/appwrite-session=([^;]+)/);
  const sessionValue = sessionMatch?.[1];

  if (!sessionValue) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  try {
    const { account } = createSessionClient(sessionValue);
    const user = await account.get();

    return opts.next({
      ctx: {
        userId: user.$id,
        user,
      },
    });
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(isAuth);
