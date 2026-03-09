import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import {
  getUserByEmail,
  getUserById,
  createUser,
  createNotification,
} from "@/lib/appwrite/db";

export const authRouter = createTRPCRouter({
  accountSetup: privateProcedure
    .input(
      z.object({
        bio: z.string(),
        link: z.string(),
        privacy: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, user } = ctx;

      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const email = user.email;
      const usernameFromEmail = email.split("@")[0]?.replace(/[+.]/g, "") ?? "user";
      const fullname = user.name || usernameFromEmail;

      // Check if user already exists
      const dbUser = await getUserByEmail(email);

      if (!dbUser) {
        const createdUser = await createUser({
          id: userId,
          username: usernameFromEmail,
          fullname,
          image: null,
          email,
          bio: input.bio,
          link: input.link,
          privacy: input.privacy,
          verified: true,
        });

        // Send welcome notification
        if (process.env.ADMIN_USER_ID) {
          await createNotification({
            isPublic: false,
            type: "ADMIN",
            senderUserId: process.env.ADMIN_USER_ID,
            receiverUserId: userId,
            message: `Hey ${fullname}! Welcome to Threads. I hope you like this project. If so, please make sure to give it a star on GitHub and share your views on Twitter. Thanks.`,
          });
        }

        return {
          username: (createdUser as unknown as { username: string }).username,
          success: true,
        };
      }

      return {
        username: dbUser.username,
        success: true,
      };
    }),
});
