import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import {
  getNotifications,
  getUserById,
  getPostById,
  getFollowers,
} from "@/lib/appwrite/db";

export const notificationRouter = createTRPCRouter({
  getNotification: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    const notifications = await getNotifications(userId);

    const enrichedNotifications = await Promise.all(
      notifications.map(async (notif) => {
        const [senderUser, post] = await Promise.all([
          getUserById(notif.senderUserId),
          notif.postId ? getPostById(notif.postId) : null,
        ]);

        const senderFollowers = senderUser
          ? await getFollowers(senderUser.$id)
          : [];

        return {
          id: notif.$id,
          createdAt: new Date(notif.$createdAt),
          type: notif.type,
          message: notif.message,
          read: notif.read,
          post: post
            ? {
                id: post.$id,
                createdAt: new Date(post.$createdAt),
                text: post.text,
                images: post.images,
                authorId: post.authorId,
                parentPostId: post.parentPostId,
                quoteId: post.quoteId,
                privacy: post.privacy,
              }
            : null,
          senderUser: senderUser
            ? {
                id: senderUser.$id,
                username: senderUser.username,
                fullname: senderUser.fullname,
                image: senderUser.image,
                bio: senderUser.bio,
                link: senderUser.link,
                email: senderUser.email,
                isAdmin: senderUser.isAdmin,
                verified: senderUser.verified,
                privacy: senderUser.privacy,
                createdAt: new Date(senderUser.$createdAt),
                updatedAt: new Date(senderUser.$updatedAt),
                followers: senderFollowers.map((f) => ({
                  id: f.$id,
                  image: f.image,
                  username: f.username,
                  fullname: f.fullname,
                })),
              }
            : null,
        };
      }),
    );

    return {
      notifications: enrichedNotifications,
    };
  }),
});
