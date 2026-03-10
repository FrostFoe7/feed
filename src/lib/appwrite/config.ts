// AppWrite collection and database IDs
// These must match the collections created in your AppWrite Console

export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID ?? "threads_db";
export const STORAGE_BUCKET_ID =
  process.env.APPWRITE_BUCKET_POST_IMAGES ??
  process.env.APPWRITE_STORAGE_BUCKET_ID ??
  "post_images";

export const BUCKET_AVATARS = process.env.APPWRITE_BUCKET_AVATARS ?? "avatars";

// Collection IDs
export const COLLECTIONS = {
  USERS: process.env.APPWRITE_COLLECTION_USERS ?? "users",
  POSTS: process.env.APPWRITE_COLLECTION_POSTS ?? "posts",
  LIKES: process.env.APPWRITE_COLLECTION_LIKES ?? "likes",
  REPOSTS: process.env.APPWRITE_COLLECTION_REPOSTS ?? "reposts",
  NOTIFICATIONS:
    process.env.APPWRITE_COLLECTION_NOTIFICATIONS ?? "notifications",
  FOLLOWS: process.env.APPWRITE_COLLECTION_FOLLOWS ?? "follows",
  REPORTS: process.env.APPWRITE_COLLECTION_REPORTS ?? "reports",
} as const;
