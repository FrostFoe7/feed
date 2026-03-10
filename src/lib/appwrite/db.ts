/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { createAdminClient, ID, Query } from "./server";
import { DATABASE_ID, COLLECTIONS, STORAGE_BUCKET_ID } from "./config";

// ─── Types ────────────────────────────────────────────────────

export type AppWriteUser = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  username: string;
  fullname: string | null;
  image: string | null;
  bio: string | null;
  link: string | null;
  email: string;
  password?: string;
  verified: boolean;
  privacy: "PUBLIC" | "PRIVATE";
  isAdmin: boolean;
};

export type AppWritePost = {
  $id: string;
  $createdAt: string;
  authorId: string;
  text: string;
  images: string[];
  parentPostId: string | null;
  quoteId: string | null;
  privacy: "ANYONE" | "FOLLOWED" | "MENTIONED";
};

export type AppWriteLike = {
  $id: string;
  $createdAt: string;
  postId: string;
  userId: string;
};

export type AppWriteRepost = {
  $id: string;
  $createdAt: string;
  postId: string;
  userId: string;
};

export type AppWriteFollow = {
  $id: string;
  $createdAt: string;
  followerId: string; // who is following
  followingId: string; // who is being followed
};

export type AppWriteNotification = {
  $id: string;
  $createdAt: string;
  read: boolean;
  type: "ADMIN" | "LIKE" | "REPLY" | "FOLLOW" | "REPOST" | "QUOTE";
  message: string;
  isPublic: boolean;
  senderUserId: string;
  receiverUserId: string | null;
  postId: string | null;
};

export type AppWriteReport = {
  $id: string;
  $createdAt: string;
  reason: string;
  postId: string | null;
  userId: string | null;
};

// ─── User Operations ──────────────────────────────────────────

export async function createUser(data: {
  id: string;
  username: string;
  fullname: string;
  image: string | null;
  email: string;
  password?: string;
  bio?: string;
  link?: string;
  privacy?: "PUBLIC" | "PRIVATE";
  verified?: boolean;
}) {
  const { databases } = createAdminClient();
  return await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.USERS,
    data.id,
    {
      username: data.username,
      fullname: data.fullname,
      image: data.image,
      email: data.email,
      password: data.password ?? null,
      bio: data.bio ?? null,
      link: data.link ?? null,
      privacy: data.privacy ?? "PUBLIC",
      verified: data.verified ?? false,
      isAdmin: false,
    },
  );
}

export async function updateUser(id: string, data: any) {
  const { databases } = createAdminClient();
  return await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, id, data);
}

export async function getUserById(id: string) {
  try {
    const { databases } = createAdminClient();
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, id);
    return doc as unknown as AppWriteUser;
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string) {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.USERS,
    [Query.equal("email", email), Query.limit(1)],
  );
  return (result.documents[0] as unknown as AppWriteUser) ?? null;
}

export async function getUserByUsername(username: string) {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.USERS,
    [Query.equal("username", username), Query.limit(1)],
  );
  return (result.documents[0] as unknown as AppWriteUser) ?? null;
}

export async function getAllUsers(
  limit = 10,
  cursor?: string,
) {
  const { databases } = createAdminClient();
  const queries = [
    Query.orderDesc("$createdAt"),
    Query.limit(limit + 1),
  ];
  if (cursor) {
    queries.push(Query.cursorAfter(cursor));
  }

  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.USERS,
    queries,
  );

  return result.documents as unknown as AppWriteUser[];
}

export async function searchUsers(search: string) {
  const { databases } = createAdminClient();
  const results = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.USERS,
    [
      Query.or([
        Query.contains("fullname", search),
        Query.contains("username", search),
        Query.contains("email", search),
      ]),
      Query.limit(25),
    ],
  );
  return results.documents as unknown as AppWriteUser[];
}

// ─── Followers ────────────────────────────────────────────────

export async function getFollowers(userId: string) {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.FOLLOWS,
    [Query.equal("followingId", userId), Query.limit(100)],
  );

  const follows = result.documents as unknown as AppWriteFollow[];
  if (follows.length === 0) return [];

  // Fetch user info for each follower
  const followerIds = follows.map((f) => f.followerId);
  const usersResult = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.USERS,
    [Query.equal("$id", followerIds), Query.limit(100)],
  );
  return usersResult.documents as unknown as AppWriteUser[];
}

export async function getFollowing(userId: string) {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.FOLLOWS,
    [Query.equal("followerId", userId), Query.limit(100)],
  );
  return result.documents as unknown as AppWriteFollow[];
}

export async function isFollowing(followerId: string, followingId: string) {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.FOLLOWS,
    [
      Query.equal("followerId", followerId),
      Query.equal("followingId", followingId),
      Query.limit(1),
    ],
  );
  return result.documents[0] as unknown as AppWriteFollow | undefined;
}

export async function createFollow(followerId: string, followingId: string) {
  const { databases } = createAdminClient();
  return await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.FOLLOWS,
    ID.unique(),
    { followerId, followingId },
  );
}

export async function deleteFollow(followerId: string, followingId: string) {
  const { databases } = createAdminClient();
  const existing = await isFollowing(followerId, followingId);
  if (existing) {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.FOLLOWS,
      existing.$id,
    );
  }
}

// ─── Post Operations ──────────────────────────────────────────

export async function createPost(data: {
  authorId: string;
  text: string;
  images?: string[];
  privacy?: "ANYONE" | "FOLLOWED" | "MENTIONED";
  parentPostId?: string;
  quoteId?: string;
}) {
  const { databases } = createAdminClient();
  return (await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.POSTS,
    ID.unique(),
    {
      authorId: data.authorId,
      text: data.text,
      images: data.images ?? [],
      privacy: data.privacy ?? "ANYONE",
      parentPostId: data.parentPostId ?? null,
      quoteId: data.quoteId ?? null,
    },
  )) as unknown as AppWritePost;
}

export async function getPostById(id: string) {
  try {
    const { databases } = createAdminClient();
    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.POSTS,
      id,
    );
    return doc as unknown as AppWritePost;
  } catch {
    return null;
  }
}

export async function deletePostById(id: string, authorId: string) {
  const { databases } = createAdminClient();
  const post = await getPostById(id);
  if (!post || post.authorId !== authorId) return null;

  // Delete child replies
  const replies = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.POSTS,
    [Query.equal("parentPostId", id)],
  );
  for (const reply of replies.documents) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.POSTS, reply.$id);
  }

  // Delete associated likes
  const likes = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.LIKES,
    [Query.equal("postId", id)],
  );
  for (const like of likes.documents) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.LIKES, like.$id);
  }

  // Delete reposts
  const reposts = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.REPOSTS,
    [Query.equal("postId", id)],
  );
  for (const repost of reposts.documents) {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.REPOSTS,
      repost.$id,
    );
  }

  // Nullify quoteId references
  const quotingPosts = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.POSTS,
    [Query.equal("quoteId", id)],
  );
  for (const qp of quotingPosts.documents) {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, qp.$id, {
      quoteId: null,
    });
  }

  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.POSTS, id);
  return { success: true };
}

export async function getInfinitePosts(
  limit = 10,
  cursor?: string,
  searchQuery?: string,
) {
  const { databases } = createAdminClient();
  const queries: string[] = [
    Query.isNull("parentPostId"),
    Query.orderDesc("$createdAt"),
    Query.limit(limit + 1),
  ];

  if (searchQuery) {
    queries.push(Query.contains("text", searchQuery));
  }

  if (cursor) {
    queries.push(Query.cursorAfter(cursor));
  }

  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.POSTS,
    queries,
  );

  return result.documents as unknown as AppWritePost[];
}

export async function getUserPosts(userId: string, parentOnly = true) {
  const { databases } = createAdminClient();

  const queries: string[] = [
    Query.equal("authorId", userId),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ];

  if (parentOnly) {
    queries.push(Query.isNull("parentPostId"));
  } else {
    queries.push(Query.isNotNull("parentPostId"));
  }

  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.POSTS,
    queries,
  );

  return result.documents as unknown as AppWritePost[];
}

export async function getPostReplies(postId: string) {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.POSTS,
    [
      Query.equal("parentPostId", postId),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
    ],
  );
  return result.documents as unknown as AppWritePost[];
}

export async function getParentChain(postId: string): Promise<AppWritePost[]> {
  const chain: AppWritePost[] = [];
  let currentId: string | null = postId;

  while (currentId) {
    const post = await getPostById(currentId);
    if (!post) break;
    chain.unshift(post);
    currentId = post.parentPostId;
  }

  return chain;
}

// ─── Like Operations ──────────────────────────────────────────

export async function getPostLikes(postId: string) {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.LIKES,
    [Query.equal("postId", postId), Query.limit(500)],
  );
  return result.documents as unknown as AppWriteLike[];
}

export async function getLikeCount(postId: string) {
  const likes = await getPostLikes(postId);
  return likes.length;
}

export async function findLike(postId: string, userId: string) {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.LIKES,
    [
      Query.equal("postId", postId),
      Query.equal("userId", userId),
      Query.limit(1),
    ],
  );
  return result.documents[0] as unknown as AppWriteLike | undefined;
}

export async function createLike(postId: string, userId: string) {
  const { databases } = createAdminClient();
  return await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.LIKES,
    ID.unique(),
    { postId, userId },
  );
}

export async function deleteLike(postId: string, userId: string) {
  const existing = await findLike(postId, userId);
  if (existing) {
    const { databases } = createAdminClient();
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.LIKES,
      existing.$id,
    );
  }
}

// ─── Repost Operations ───────────────────────────────────────

export async function getPostReposts(postId: string) {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.REPOSTS,
    [Query.equal("postId", postId), Query.limit(500)],
  );
  return result.documents as unknown as AppWriteRepost[];
}

export async function findRepost(postId: string, userId: string) {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.REPOSTS,
    [
      Query.equal("postId", postId),
      Query.equal("userId", userId),
      Query.limit(1),
    ],
  );
  return result.documents[0] as unknown as AppWriteRepost | undefined;
}

export async function createRepost(postId: string, userId: string) {
  const { databases } = createAdminClient();
  return await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.REPOSTS,
    ID.unique(),
    { postId, userId },
  );
}

export async function deleteRepost(postId: string, userId: string) {
  const existing = await findRepost(postId, userId);
  if (existing) {
    const { databases } = createAdminClient();
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.REPOSTS,
      existing.$id,
    );
  }
}

export async function getUserReposts(userId: string) {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.REPOSTS,
    [Query.equal("userId", userId), Query.orderDesc("$createdAt"), Query.limit(50)],
  );

  const reposts = result.documents as unknown as AppWriteRepost[];
  const posts: AppWritePost[] = [];

  for (const repost of reposts) {
    const post = await getPostById(repost.postId);
    if (post) posts.push(post);
  }

  return posts;
}

// ─── Notification Operations ──────────────────────────────────

export async function createNotification(data: {
  type: AppWriteNotification["type"];
  senderUserId: string;
  receiverUserId?: string | null;
  postId?: string | null;
  message: string;
  isPublic?: boolean;
}) {
  const { databases } = createAdminClient();
  return await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.NOTIFICATIONS,
    ID.unique(),
    {
      type: data.type,
      senderUserId: data.senderUserId,
      receiverUserId: data.receiverUserId ?? null,
      postId: data.postId ?? null,
      message: data.message,
      isPublic: data.isPublic ?? false,
      read: false,
    },
  );
}

export async function getNotifications(userId: string) {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.NOTIFICATIONS,
    [
      Query.or([
        Query.and([Query.equal("isPublic", true), Query.equal("type", "ADMIN")]),
        Query.and([
          Query.equal("isPublic", false),
          Query.equal("type", "ADMIN"),
          Query.equal("receiverUserId", userId),
        ]),
        Query.and([
          Query.equal("isPublic", false),
          Query.equal("receiverUserId", userId),
          Query.notEqual("senderUserId", userId),
        ]),
      ]),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
    ],
  );
  return result.documents as unknown as AppWriteNotification[];
}

export async function findNotification(
  senderUserId: string,
  postId: string | null,
  type: string,
) {
  const { databases } = createAdminClient();
  const queries = [
    Query.equal("senderUserId", senderUserId),
    Query.equal("type", type),
    Query.limit(1),
  ];
  if (postId) queries.push(Query.equal("postId", postId));

  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.NOTIFICATIONS,
    queries,
  );
  return result.documents[0] as unknown as AppWriteNotification | undefined;
}

export async function deleteNotification(id: string) {
  const { databases } = createAdminClient();
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, id);
}

// ─── Storage / File Uploads ───────────────────────────────────

export async function uploadFile(file: File) {
  const { storage } = createAdminClient();
  const result = await storage.createFile(
    STORAGE_BUCKET_ID,
    ID.unique(),
    file,
  );
  return result;
}

export function getFilePreviewUrl(fileId: string) {
  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
}

export function getFileUrl(fileId: string) {
  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
}

// ─── Helper: Enrich posts with author, likes, replies, reposts ─

export type EnrichedPost = {
  id: string;
  createdAt: Date;
  text: string;
  images: string[];
  parentPostId: string | null;
  quoteId: string | null;
  author: {
    id: string;
    image: string | null;
    fullname: string | null;
    username: string;
    bio: string | null;
    link: string | null;
    createdAt: Date;
    isAdmin: boolean;
    followers: { id: string; image: string | null }[];
  };
  likes: { userId: string }[];
  replies: { author: { id: string; username: string; image: string | null } }[];
  count: { likeCount: number; replyCount: number };
  reposts: { postId: string; userId: string }[];
};

export async function enrichPost(post: AppWritePost): Promise<EnrichedPost> {
  const [author, likes, replies, reposts, followers] = await Promise.all([
    getUserById(post.authorId),
    getPostLikes(post.$id),
    getPostReplies(post.$id),
    getPostReposts(post.$id),
    getFollowers(post.authorId),
  ]);

  const replyAuthors = await Promise.all(
    replies.slice(0, 3).map(async (r) => {
      const a = await getUserById(r.authorId);
      return {
        id: a?.$id ?? r.authorId,
        username: a?.username ?? "unknown",
        image: a?.image ?? null,
      };
    }),
  );

  return {
    id: post.$id,
    createdAt: new Date(post.$createdAt),
    text: post.text,
    images: post.images,
    parentPostId: post.parentPostId,
    quoteId: post.quoteId,
    author: {
      id: author?.$id ?? post.authorId,
      image: author?.image ?? null,
      fullname: author?.fullname ?? null,
      username: author?.username ?? "unknown",
      bio: author?.bio ?? null,
      link: author?.link ?? null,
      createdAt: new Date(author?.$createdAt ?? post.$createdAt),
      isAdmin: author?.isAdmin ?? false,
      followers: followers.map((f) => ({ id: f.$id, image: f.image })),
    },
    likes: likes.map((l) => ({ userId: l.userId })),
    replies: replyAuthors.map((a) => ({ author: a })),
    count: {
      likeCount: likes.length,
      replyCount: replies.length,
    },
    reposts: reposts.map((r) => ({ postId: r.postId, userId: r.userId })),
  };
}

export async function enrichPosts(
  posts: AppWritePost[],
): Promise<EnrichedPost[]> {
  return Promise.all(posts.map(enrichPost));
}
