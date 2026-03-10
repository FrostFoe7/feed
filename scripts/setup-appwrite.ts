/**
 * Appwrite Backend Provisioning Script for Threads Clone
 *
 * Creates the entire Appwrite backend in one idempotent run:
 *   - 1 Database
 *   - 7 Collections (Users, Posts, Likes, Reposts, Follows, Notifications, Reports)
 *   - All attributes with correct types
 *   - All indexes (with polling to wait for attribute availability)
 *   - 2 Storage Buckets (Avatars, Post Images)
 *
 * Usage:
 *   npx tsx scripts/setup-appwrite.ts
 *
 * Required env vars:
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT  – e.g. https://cloud.appwrite.io/v1
 *   NEXT_PUBLIC_APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY               – must have full admin scopes
 */

import {
  Client,
  Databases,
  Storage,
  Permission,
  Role,
  IndexType,
} from "node-appwrite";

// ─── Configuration ────────────────────────────────────────────

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error(
    "Missing required env vars: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY",
  );
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

// IDs – deterministic so the script is idempotent
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID ?? "threads_db";

const COL = {
  USERS: process.env.APPWRITE_COLLECTION_USERS ?? "users",
  POSTS: process.env.APPWRITE_COLLECTION_POSTS ?? "posts",
  LIKES: process.env.APPWRITE_COLLECTION_LIKES ?? "likes",
  REPOSTS: process.env.APPWRITE_COLLECTION_REPOSTS ?? "reposts",
  FOLLOWS: process.env.APPWRITE_COLLECTION_FOLLOWS ?? "follows",
  NOTIFICATIONS: process.env.APPWRITE_COLLECTION_NOTIFICATIONS ?? "notifications",
  REPORTS: process.env.APPWRITE_COLLECTION_REPORTS ?? "reports",
} as const;

const BUCKET = {
  AVATARS: process.env.APPWRITE_BUCKET_AVATARS ?? "avatars",
  POST_IMAGES: process.env.APPWRITE_BUCKET_POST_IMAGES ?? "post_images",
} as const;

// ─── Helpers ──────────────────────────────────────────────────

function log(msg: string) {
  console.log(`  ✓ ${msg}`);
}

function info(msg: string) {
  console.log(`\n◆ ${msg}`);
}

/** Try to create; if 409 (already exists), skip gracefully. */
async function tryCreate<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    const result = await fn();
    log(label);
    return result;
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    if (e.code === 409) {
      log(`${label} (already exists)`);
      return null;
    }
    throw err;
  }
}

/**
 * Poll collection attributes until all are "available" or fail.
 * Appwrite processes attributes asynchronously — indexes can only
 * be created once attributes reach the "available" status.
 */
async function waitForAttributes(
  databaseId: string,
  collectionId: string,
  maxWaitMs = 60_000,
) {
  const startTime = Date.now();
  const POLL_INTERVAL = 1500;

  while (Date.now() - startTime < maxWaitMs) {
    const { attributes } = await databases.listAttributes(databaseId, collectionId);
    const pending = (attributes as Array<{ status: string }>).filter(
      (a) => a.status === "processing",
    );
    const stuck = (attributes as Array<{ status: string }>).filter(
      (a) => a.status === "stuck" || a.status === "failed",
    );

    if (stuck.length > 0) {
      throw new Error(
        `Attribute(s) stuck/failed in ${collectionId}: ${JSON.stringify(stuck)}`,
      );
    }

    if (pending.length === 0) return; // all available

    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }

  throw new Error(`Timed out waiting for attributes in ${collectionId}`);
}

// ─── Attribute Creators ───────────────────────────────────────

type AttrDef =
  | { type: "string"; key: string; size: number; required: boolean; array?: boolean }
  | { type: "boolean"; key: string; required: boolean; default?: boolean }
  | { type: "email"; key: string; required: boolean }
  | { type: "enum"; key: string; elements: string[]; required: boolean; default?: string };

async function createAttributes(databaseId: string, collectionId: string, attrs: AttrDef[]) {
  for (const attr of attrs) {
    const label = `${collectionId}.${attr.key}`;
    switch (attr.type) {
      case "string":
        await tryCreate(label, () =>
          databases.createStringAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.size,
            attr.required,
            undefined,
            attr.array ?? false,
          ),
        );
        break;
      case "boolean":
        await tryCreate(label, () =>
          databases.createBooleanAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
          ),
        );
        break;
      case "email":
        await tryCreate(label, () =>
          databases.createEmailAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
          ),
        );
        break;
      case "enum":
        await tryCreate(label, () =>
          databases.createEnumAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.elements,
            attr.required,
            attr.default,
          ),
        );
        break;
    }
  }
}

// ─── Index Creator ────────────────────────────────────────────

type IdxDef = {
  key: string;
  type: IndexType;
  attributes: string[];
};

async function createIndexes(databaseId: string, collectionId: string, indexes: IdxDef[]) {
  for (const idx of indexes) {
    await tryCreate(`index ${collectionId}.${idx.key}`, () =>
      databases.createIndex(databaseId, collectionId, idx.key, idx.type, idx.attributes),
    );
  }
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   Appwrite Backend Provisioning – Threads Clone     ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`  Endpoint : ${ENDPOINT}`);
  console.log(`  Project  : ${PROJECT_ID}\n`);

  // ── 1. Database ──────────────────────────────────────────────

  info("Creating database...");
  await tryCreate(`Database "${DATABASE_ID}"`, () =>
    databases.create(DATABASE_ID, "Threads Clone"),
  );

  // ── 2. Collections ───────────────────────────────────────────

  const anyAuth = [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ];

  info("Creating collections...");
  for (const [, id] of Object.entries(COL)) {
    const name = id.charAt(0).toUpperCase() + id.slice(1);
    await tryCreate(`Collection "${id}"`, () =>
      databases.createCollection(DATABASE_ID, id, name, anyAuth, true),
    );
  }

  // ── 3. Attributes ───────────────────────────────────────────

  // ─── Users ──────────────────────────────────────────────────
  info("Creating Users attributes...");
  await createAttributes(DATABASE_ID, COL.USERS, [
    { type: "string", key: "username", size: 128, required: true },
    { type: "string", key: "fullname", size: 256, required: false },
    { type: "string", key: "image", size: 2048, required: false },
    { type: "string", key: "bio", size: 2048, required: false },
    { type: "string", key: "link", size: 2048, required: false },
    { type: "email", key: "email", required: true },
    { type: "boolean", key: "verified", required: false, default: false },
    { type: "enum", key: "privacy", elements: ["PUBLIC", "PRIVATE"], required: false, default: "PUBLIC" },
    { type: "boolean", key: "isAdmin", required: false, default: false },
    { type: "string", key: "password", size: 256, required: false },
  ]);

  // ─── Posts ──────────────────────────────────────────────────
  info("Creating Posts attributes...");
  await createAttributes(DATABASE_ID, COL.POSTS, [
    { type: "string", key: "authorId", size: 128, required: true },
    { type: "string", key: "text", size: 5000, required: true },
    { type: "string", key: "images", size: 2048, required: false, array: true },
    { type: "string", key: "parentPostId", size: 128, required: false },
    { type: "string", key: "quoteId", size: 128, required: false },
    { type: "enum", key: "privacy", elements: ["ANYONE", "FOLLOWED", "MENTIONED"], required: false, default: "ANYONE" },
  ]);

  // ─── Likes ──────────────────────────────────────────────────
  info("Creating Likes attributes...");
  await createAttributes(DATABASE_ID, COL.LIKES, [
    { type: "string", key: "postId", size: 128, required: true },
    { type: "string", key: "userId", size: 128, required: true },
  ]);

  // ─── Reposts ────────────────────────────────────────────────
  info("Creating Reposts attributes...");
  await createAttributes(DATABASE_ID, COL.REPOSTS, [
    { type: "string", key: "postId", size: 128, required: true },
    { type: "string", key: "userId", size: 128, required: true },
  ]);

  // ─── Follows ────────────────────────────────────────────────
  info("Creating Follows attributes...");
  await createAttributes(DATABASE_ID, COL.FOLLOWS, [
    { type: "string", key: "followerId", size: 128, required: true },
    { type: "string", key: "followingId", size: 128, required: true },
  ]);

  // ─── Notifications ──────────────────────────────────────────
  info("Creating Notifications attributes...");
  await createAttributes(DATABASE_ID, COL.NOTIFICATIONS, [
    { type: "boolean", key: "read", required: false, default: false },
    { type: "enum", key: "type", elements: ["ADMIN", "LIKE", "REPLY", "FOLLOW", "REPOST", "QUOTE"], required: true },
    { type: "string", key: "message", size: 4096, required: true },
    { type: "boolean", key: "isPublic", required: false, default: false },
    { type: "string", key: "senderUserId", size: 128, required: true },
    { type: "string", key: "receiverUserId", size: 128, required: false },
    { type: "string", key: "postId", size: 128, required: false },
  ]);

  // ─── Reports ────────────────────────────────────────────────
  info("Creating Reports attributes...");
  await createAttributes(DATABASE_ID, COL.REPORTS, [
    { type: "string", key: "reason", size: 4096, required: true },
    { type: "string", key: "postId", size: 128, required: false },
    { type: "string", key: "userId", size: 128, required: false },
  ]);

  // ── 4. Wait for all attributes to be available ───────────────

  info("Waiting for all attributes to become available...");
  for (const [name, id] of Object.entries(COL)) {
    process.stdout.write(`  ⏳ ${name}...`);
    await waitForAttributes(DATABASE_ID, id);
    process.stdout.write(" ready\n");
  }

  // ── 5. Indexes ──────────────────────────────────────────────

  info("Creating indexes...");

  // Users indexes
  await createIndexes(DATABASE_ID, COL.USERS, [
    { key: "idx_username", type: IndexType.Unique, attributes: ["username"] },
    { key: "idx_email", type: IndexType.Unique, attributes: ["email"] },
  ]);

  // Posts indexes
  await createIndexes(DATABASE_ID, COL.POSTS, [
    { key: "idx_authorId", type: IndexType.Key, attributes: ["authorId"] },
    { key: "idx_parentPostId", type: IndexType.Key, attributes: ["parentPostId"] },
    { key: "idx_createdAt", type: IndexType.Key, attributes: ["$createdAt"] },
  ]);

  // Likes indexes (composite unique to prevent duplicate likes)
  await createIndexes(DATABASE_ID, COL.LIKES, [
    { key: "idx_postId_userId", type: IndexType.Unique, attributes: ["postId", "userId"] },
    { key: "idx_postId", type: IndexType.Key, attributes: ["postId"] },
    { key: "idx_userId", type: IndexType.Key, attributes: ["userId"] },
  ]);

  // Reposts indexes
  await createIndexes(DATABASE_ID, COL.REPOSTS, [
    { key: "idx_postId_userId", type: IndexType.Unique, attributes: ["postId", "userId"] },
    { key: "idx_userId", type: IndexType.Key, attributes: ["userId"] },
  ]);

  // Follows indexes (composite unique to prevent duplicate follows)
  await createIndexes(DATABASE_ID, COL.FOLLOWS, [
    { key: "idx_followerId_followingId", type: IndexType.Unique, attributes: ["followerId", "followingId"] },
    { key: "idx_followerId", type: IndexType.Key, attributes: ["followerId"] },
    { key: "idx_followingId", type: IndexType.Key, attributes: ["followingId"] },
  ]);

  // Notifications indexes
  await createIndexes(DATABASE_ID, COL.NOTIFICATIONS, [
    { key: "idx_receiverUserId", type: IndexType.Key, attributes: ["receiverUserId"] },
    { key: "idx_senderUserId", type: IndexType.Key, attributes: ["senderUserId"] },
    { key: "idx_createdAt", type: IndexType.Key, attributes: ["$createdAt"] },
  ]);

  // Reports indexes
  await createIndexes(DATABASE_ID, COL.REPORTS, [
    { key: "idx_postId", type: IndexType.Key, attributes: ["postId"] },
    { key: "idx_userId", type: IndexType.Key, attributes: ["userId"] },
  ]);

  // ── 6. Storage Buckets ──────────────────────────────────────

  info("Creating storage buckets...");

  const bucketPerms = [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ];

  await tryCreate(`Bucket "${BUCKET.AVATARS}"`, () =>
    storage.createBucket(
      BUCKET.AVATARS,
      "Avatars",
      bucketPerms,
      true,   // fileSecurity
      true,   // enabled
      10 * 1024 * 1024, // 10 MB max
      ["jpg", "jpeg", "png", "gif", "webp", "svg"],
    ),
  );

  await tryCreate(`Bucket "${BUCKET.POST_IMAGES}"`, () =>
    storage.createBucket(
      BUCKET.POST_IMAGES,
      "Post Images",
      bucketPerms,
      true,   // fileSecurity
      true,   // enabled
      10 * 1024 * 1024, // 10 MB max
      ["jpg", "jpeg", "png", "gif", "webp"],
    ),
  );

  // ── 7. Output .env block ────────────────────────────────────

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║          ✅  Provisioning Complete!                  ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log("\nPaste the following into your .env / .env.local:\n");

  const envBlock = `
# ─── Appwrite (auto-generated by setup-appwrite.ts) ───────────
NEXT_PUBLIC_APPWRITE_ENDPOINT=${ENDPOINT}
NEXT_PUBLIC_APPWRITE_PROJECT_ID=${PROJECT_ID}
APPWRITE_API_KEY=${API_KEY}
APPWRITE_DATABASE_ID=${DATABASE_ID}
APPWRITE_STORAGE_BUCKET_ID=${BUCKET.POST_IMAGES}

# ─── Collection IDs ───────────────────────────────────────────
APPWRITE_COLLECTION_USERS=${COL.USERS}
APPWRITE_COLLECTION_POSTS=${COL.POSTS}
APPWRITE_COLLECTION_LIKES=${COL.LIKES}
APPWRITE_COLLECTION_REPOSTS=${COL.REPOSTS}
APPWRITE_COLLECTION_FOLLOWS=${COL.FOLLOWS}
APPWRITE_COLLECTION_NOTIFICATIONS=${COL.NOTIFICATIONS}
APPWRITE_COLLECTION_REPORTS=${COL.REPORTS}

# ─── Storage Bucket IDs ──────────────────────────────────────
APPWRITE_BUCKET_AVATARS=${BUCKET.AVATARS}
APPWRITE_BUCKET_POST_IMAGES=${BUCKET.POST_IMAGES}

# ─── Admin ────────────────────────────────────────────────────
ADMIN_USER_ID=<your-admin-appwrite-user-id>
`.trim();

  console.log(envBlock);
  console.log("");
}

main().catch((err) => {
  console.error("\n❌ Provisioning failed:", err);
  process.exit(1);
});
