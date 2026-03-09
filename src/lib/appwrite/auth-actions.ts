"use server";

import { createAdminClient } from "@/lib/appwrite/server";
import { setSession, clearSession } from "@/lib/appwrite/session";
import { redirect } from "next/navigation";
import { OAuthProvider } from "node-appwrite";
import { headers } from "next/headers";

export async function loginWithEmail(email: string, password: string) {
  const { account } = createAdminClient();
  const session = await account.createEmailPasswordSession(email, password);
  await setSession(session.secret);
  return { success: true };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
) {
  const { account } = createAdminClient();
  await account.create("unique()", email, password, name);
  const session = await account.createEmailPasswordSession(email, password);
  await setSession(session.secret);
  return { success: true };
}

export async function loginWithGoogle() {
  const { account } = createAdminClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  const redirectUrl = await account.createOAuth2Token(
    OAuthProvider.Google,
    `${origin}/sso-callback`,
    `${origin}/login`,
  );

  return redirect(redirectUrl);
}

export async function handleOAuthCallback(
  userId: string,
  secret: string,
) {
  const { account } = createAdminClient();
  const session = await account.createSession(userId, secret);
  await setSession(session.secret);
  return { success: true };
}

export async function logout() {
  const { account } = createAdminClient();
  try {
    await account.deleteSession("current");
  } catch {
    // Session may already be expired
  }
  await clearSession();
}
