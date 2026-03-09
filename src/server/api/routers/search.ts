import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { searchUsers, getFollowers } from "@/lib/appwrite/db";

export const searchRouter = createTRPCRouter({
  allUsers: publicProcedure
    .input(z.object({ debouncedSearch: z.string() }))
    .query(async ({ input }) => {
      const users = await searchUsers(input.debouncedSearch);

      const enriched = await Promise.all(
        users.map(async (user) => {
          const followers = await getFollowers(user.$id);
          return {
            id: user.$id,
            image: user.image,
            fullname: user.fullname,
            username: user.username,
            bio: user.bio,
            link: user.link,
            createdAt: new Date(user.$createdAt),
            isAdmin: user.isAdmin,
            followers: followers.map((f) => ({ id: f.$id, image: f.image })),
          };
        }),
      );

      return enriched;
    }),
});
