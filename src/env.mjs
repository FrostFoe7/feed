import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APPWRITE_API_KEY: z.string(),
    APPWRITE_DATABASE_ID: z.string(),
    APPWRITE_STORAGE_BUCKET_ID: z.string(),
    ADMIN_USER_ID: z.string().optional(),
  },

  client: {
    NEXT_PUBLIC_APPWRITE_ENDPOINT: z.string().url(),
    NEXT_PUBLIC_APPWRITE_PROJECT_ID: z.string(),
  },

  runtimeEnv: {
    ADMIN_USER_ID: process.env.ADMIN_USER_ID,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    NEXT_PUBLIC_APPWRITE_PROJECT_ID:
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
    APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID,
    APPWRITE_STORAGE_BUCKET_ID: process.env.APPWRITE_STORAGE_BUCKET_ID,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
