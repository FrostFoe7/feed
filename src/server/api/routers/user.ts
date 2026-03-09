import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  getUserByUsername,
  getUserPosts,
  getUserReposts,
  getAllUsers,
  isFollowing,
  createFollow,
  deleteFollow,
  createNotification,
  findNotification,
  deleteNotification,
  getFollowers,
  enrichPosts,
} from "@/lib/appwrite/db";

export const userRouter = createTRPCRouter({
  Info: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const user = await getUserByUsername(input.username);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const followers = await getFollowers(user.$id);

      return {
        userDetails: {
          id: user.$id,
          image: user.image,
          fullname: user.fullname,
          username: user.username,
          bio: user.bio,
          link: user.link,
          privacy: user.privacy,
          createdAt: new Date(user.$createdAt),
          isAdmin: user.isAdmin,
          followers: followers.map((f: { $id: string; image: string | null; username: string; fullname: string | null }) => ({
            id: f.$id,
            image: f.image,
            username: f.username,
            fullname: f.fullname,
          })),
        },
      };
    }),

  postInfo: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const user = await getUserByUsername(input.username);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const posts = await getUserPosts(user.$id, false);
      const enriched = await enrichPosts(posts);
      return enriched;
    }),

  repliesInfo: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const user = await getUserByUsername(input.username);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const replies = await getUserPosts(user.$id, true);
      const enriched = await enrichPosts(replies);
      return enriched;
    }),

  repostsInfo: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const user = await getUserByUsername(input.username);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const reposts = await getUserReposts(user.$id);
      const enriched = await enrichPosts(reposts);
      return enriched;
    }),

  allUsers: privateProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      }),
    )
    .query(async ({ input: { limit = 10, cursor } }) => {
      const allUsersResult = await getAllUsers(limit + 1, cursor?.id);

      let nextCursor: typeof cursor | undefined;

      if (allUsersResult.length > limit) {
        const nextItem = allUsersResult.pop();
        if (nextItem) {
          nextCursor = {
            id: nextItem.$id,
            createdAt: new Date(nextItem.$createdAt),
          };
        }
      }

      const allUsers = allUsersResult.map((u) => ({
        id: u.$id,
        username: u.username,
        fullname: u.fullname,
        image: u.image,
        bio: u.bio,
        link: u.link,
        isAdmin: u.isAdmin,
        createdAt: new Date(u.$createdAt),
        followers: [] as { id: string; username: string; image: string | null }[],
      }));

      return {
        allUsers,
        nextCursor,
      };
    }),

  toggleFollow: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx;

      const alreadyFollowing = await isFollowing(userId, input.id);

      if (!alreadyFollowing) {
        await createFollow(userId, input.id);
        await createNotification({
          type: "FOLLOW",
          senderUserId: userId,
          receiverUserId: input.id,
          message: '"Followed you"',
        });
        return { followUser: true };
      } else {
        await deleteFollow(userId, input.id);
        const notification = await findNotification(userId, input.id, "FOLLOW");
        if (notification) {
          await deleteNotification(notification.$id);
        }
        return { unFollowUser: false };
      }
    }),
});
