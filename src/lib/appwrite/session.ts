"use server";

import { auth } from "@/auth";

export async function getLoggedInUser() {
  try {
    const session = await auth();
    if (!session?.user) return null;
    return session.user;
  } catch {
    return null;
  }
}
