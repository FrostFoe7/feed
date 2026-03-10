"use server";

import { getServerAuthSession } from "@/server/auth";

export async function getLoggedInUser() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) return null;
    return session.user;
  } catch {
    return null;
  }
}
