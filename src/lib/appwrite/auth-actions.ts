"use server";

/**
 * Note: For Credentials auth (email/password), we use next-auth/react's `signIn`
 * directly on the client side.
 */

export async function loginWithEmail() {
  return {
    success: false,
    message: "Use next-auth/react signIn('credentials', ...) on the client.",
  };
}

export async function signUpWithEmail() {
  return {
    success: false,
    message:
      "Use next-auth/react signIn('credentials', { mode: 'register', ... }) on the client.",
  };
}

export async function logout() {
  // Use next-auth/react's signOut() on the client
  return {
    success: false,
    message: "Use next-auth/react signOut() on the client.",
  };
}
