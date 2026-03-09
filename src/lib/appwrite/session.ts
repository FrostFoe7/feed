"use server";

import { cookies } from "next/headers";
import { createAdminClient, createSessionClient } from "./server";

const SESSION_COOKIE = "appwrite-session";

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function setSession(secret: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, secret, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getLoggedInUser() {
  try {
    const session = await getSession();
    if (!session) return null;

    const { account } = createSessionClient(session);
    return await account.get();
  } catch {
    return null;
  }
}
