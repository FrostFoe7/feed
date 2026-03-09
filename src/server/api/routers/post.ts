import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import Filter from "bad-words";
import {
  getUserById,
  getPostById,
  createPost as dbCreatePost,
  deletePostById,
  getInfinitePosts,
  enrichPost,
  enrichPosts,
  getPostReplies,
  getPostLikes,
  getPostReposts,
  getParentChain,
  findRepost,
  createRepost,
  deleteRepost,
  createNotification,
  findNotification,
  deleteNotification,
  getFollowers,
} from "@/lib/appwrite/db";

export const postRouter = createTRPCRouter({
  createPost: privateProcedure
    .input(
      z.object({
        text: z.string().min(3, { message: "Text must be at least 3 characters" }),
        imageUrl: z.string().optional(),
        privacy: z.enum(["ANYONE", "FOLLOWED", "MENTIONED"]).default("ANYONE"),
        quoteId: z.string().optional(),
        postAuthor: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const filter = new Filter();
      const filteredText = filter.clean(input.text);

      const newPost = await dbCreatePost({
        authorId: userId,
        text: filteredText,
        images: input.imageUrl ? [input.imageUrl] : [],
        privacy: input.privacy,
        quoteId: input.quoteId,
      });

      const author = await getUserById(userId);

      if (input.postAuthor && userId !== input.postAuthor) {
        await createNotification({
          type: "QUOTE",
          senderUserId: userId,
          receiverUserId: input.postAuthor,
          postId: newPost.$id,
          message: input.text,
        });
      }

      return {
        createPost: {
          id: newPost.$id,
          author: {
            id: author?.$id ?? userId,
            username: author?.username ?? "unknown",
          },
        },
        success: true,
      };
    }),

  getInfinitePost: publicProcedure
    .input(
      z.object({
        searchQuery: z.string().optional(),
        limit: z.number().optional(),
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      }),
    )
    .query(async ({ input: { limit = 10, cursor, searchQuery } }) => {
      const posts = await getInfinitePosts(limit, cursor?.id, searchQuery);

      let nextCursor: typeof cursor | undefined;

      if (posts.length > limit) {
        const nextItem = posts.pop();
        if (nextItem) {
          nextCursor = {
            id: nextItem.$id,
            createdAt: new Date(nextItem.$createdAt),
          };
        }
      }

      const enrichedPosts = await enrichPosts(posts);

      return {
        posts: enrichedPosts,
        nextCursor,
      };
    }),

  getPostInfo: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const post = await getPostById(input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      const [author, likes, replies, parentPost] = await Promise.all([
        getUserById(post.authorId),
        getPostLikes(post.$id),
        getPostReplies(post.$id),
        post.parentPostId ? getPostById(post.parentPostId) : null,
      ]);

      const authorFollowers = author ? await getFollowers(author.$id) : [];

      const likeUsers = await Promise.all(
        likes.map(async (like) => {
          const user = await getUserById(like.userId);
          if (!user) return null;
          const followers = await getFollowers(user.$id);
          return {
            user: {
              id: user.$id,
              username: user.username,
              fullname: user.fullname,
              image: user.image,
              bio: user.bio,
              followers: followers.map((f: { $id: string; image: string | null; username: string; fullname: string | null }) => ({
                id: f.$id,
                image: f.image,
                username: f.username,
                fullname: f.fullname,
              })),
            },
          };
        }),
      );

      const enrichedReplies = await Promise.all(
        replies.map(async (reply) => {
          const rAuthor = await getUserById(reply.authorId);
          const rLikes = await getPostLikes(reply.$id);
          const rReplies = await getPostReplies(reply.$id);
          const rAuthorFollowers = rAuthor ? await getFollowers(rAuthor.$id) : [];
          return {
            id: reply.$id,
            text: reply.text,
            createdAt: new Date(reply.$createdAt),
            author: {
              id: rAuthor?.$id ?? reply.authorId,
              username: rAuthor?.username ?? "unknown",
              image: rAuthor?.image ?? null,
              bio: rAuthor?.bio ?? null,
              _count: { followers: rAuthorFollowers.length },
            },
            _count: { likes: rLikes.length, replies: rReplies.length },
            likes: rLikes.map((l) => ({ userId: l.userId })),
          };
        }),
      );

      return {
        postInfo: {
          id: post.$id,
          text: post.text,
          createdAt: new Date(post.$createdAt),
          likeCount: likes.length,
          replyCount: replies.length,
          user: {
            id: author?.$id ?? post.authorId,
            username: author?.username ?? "unknown",
            image: author?.image ?? null,
            bio: author?.bio ?? null,
            _count: { followers: authorFollowers.length },
          },
          parentPost: parentPost
            ? {
                id: parentPost.$id,
                text: parentPost.text,
                createdAt: new Date(parentPost.$createdAt),
                authorId: parentPost.authorId,
                images: parentPost.images,
                parentPostId: parentPost.parentPostId,
                quoteId: parentPost.quoteId,
                privacy: parentPost.privacy,
              }
            : null,
          likes: likeUsers.filter(Boolean),
          replies: enrichedReplies,
        },
      };
    }),

  replyToPost: privateProcedure
    .input(
      z.object({
        postAuthor: z.string(),
        postId: z.string(),
        text: z.string().min(3, { message: "Text must be at least 3 characters" }),
        imageUrl: z.string().optional(),
        privacy: z.enum(["ANYONE", "FOLLOWED", "MENTIONED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const filter = new Filter();
      const filteredText = filter.clean(input.text);

      const repliedPost = await dbCreatePost({
        authorId: userId,
        text: filteredText,
        images: input.imageUrl ? [input.imageUrl] : [],
        privacy: input.privacy,
        parentPostId: input.postId,
      });

      const author = await getUserById(userId);

      if (userId !== input.postAuthor) {
        await createNotification({
          type: "REPLY",
          senderUserId: userId,
          receiverUserId: input.postAuthor,
          postId: input.postId,
          message: input.text,
        });
      }

      return {
        createPost: {
          id: repliedPost.$id,
          author: {
            id: author?.$id ?? userId,
            username: author?.username ?? "unknown",
          },
        },
        success: true,
      };
    }),

  getNestedPosts: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;

      const post = await getPostById(id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      const enrichedMain = await enrichPost(post);
      const replies = await getPostReplies(id);
      const enrichedReplies = await enrichPosts(replies);

      const parentChain = await getParentChain(id);
      const enrichedParents = await enrichPosts(
        parentChain.filter((p) => p.$id !== id),
      );

      return {
        postInfo: {
          ...enrichedMain,
          replies: enrichedReplies,
        },
        parentPosts: enrichedParents,
      };
    }),

  toggleRepost: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const { userId } = ctx;

      const existingRepost = await findRepost(id, userId);

      if (!existingRepost) {
        await createRepost(id, userId);

        const post = await getPostById(id);
        if (post) {
          await createNotification({
            type: "REPOST",
            postId: id,
            message: post.text,
            senderUserId: userId,
            receiverUserId: post.authorId,
          });
        }
        return { createdRepost: true };
      } else {
        await deleteRepost(id, userId);

        const notification = await findNotification(userId, id, "REPOST");
        if (notification) {
          await deleteNotification(notification.$id);
        }
        return { createdRepost: false };
      }
    }),

  getQuotedPost: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const post = await getPostById(input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      const enriched = await enrichPost(post);

      return {
        postInfo: {
          id: enriched.id,
          text: enriched.text,
          createdAt: enriched.createdAt,
          likeCount: enriched.count.likeCount,
          replyCount: enriched.count.replyCount,
          user: enriched.author,
          likes: enriched.likes,
          replies: enriched.replies,
        },
      };
    }),

  deletePost: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx;
      const result = await deletePostById(input.id, userId);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
