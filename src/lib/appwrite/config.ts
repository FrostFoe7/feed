// AppWrite collection and database IDs
// These must match the collections created in your AppWrite Console

export const DATABASE_ID =
  process.env.APPWRITE_DATABASE_ID ?? "threads_db";
export const STORAGE_BUCKET_ID =
  process.env.APPWRITE_STORAGE_BUCKET_ID ?? "threads_uploads";

// Collection IDs
export const COLLECTIONS = {
  USERS: "users",
  POSTS: "posts",
  LIKES: "likes",
  REPOSTS: "reposts",
  NOTIFICATIONS: "notifications",
  FOLLOWS: "follows",
  REPORTS: "reports",
} as const;
