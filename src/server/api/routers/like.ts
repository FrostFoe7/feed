import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  findLike,
  createLike,
  deleteLike,
  getPostLikes,
  getPostReposts,
  getPostById,
  getUserById,
  createNotification,
  findNotification,
  deleteNotification,
  getFollowers,
} from "@/lib/appwrite/db";

export const likeRouter = createTRPCRouter({
  toggleLike: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const { userId } = ctx;

      const existingLike = await findLike(id, userId);

      if (!existingLike) {
        await createLike(id, userId);

        const post = await getPostById(id);
        if (post) {
          await createNotification({
            type: "LIKE",
            senderUserId: userId,
            receiverUserId: post.authorId,
            postId: id,
            message: post.text,
          });
        }

        return { addedLike: true };
      } else {
        await deleteLike(id, userId);

        const notification = await findNotification(userId, id, "LIKE");
        if (notification) {
          await deleteNotification(notification.$id);
        }

        return { addedLike: false };
      }
    }),

  postLikeInfo: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const post = await getPostById(input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      const [likes, reposts] = await Promise.all([
        getPostLikes(input.id),
        getPostReposts(input.id),
      ]);

      const likeUsers = await Promise.all(
        likes.map(async (like) => {
          const user = await getUserById(like.userId);
          if (!user) return null;
          const followers = await getFollowers(user.$id);
          return {
            user: {
              id: user.$id,
              image: user.image,
              fullname: user.fullname,
              username: user.username,
              bio: user.bio,
              link: user.link,
              createdAt: new Date(user.$createdAt),
              isAdmin: user.isAdmin,
              followers: followers.map((f) => ({ id: f.$id, image: f.image })),
            },
          };
        }),
      );

      return {
        likes: likeUsers.filter(Boolean) as NonNullable<
          (typeof likeUsers)[number]
        >[],
        reposts: reposts.map((r) => ({ userId: r.userId })),
      };
    }),
});
