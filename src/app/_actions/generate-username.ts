"use server";

import { searchUsers } from "@/lib/appwrite/db";

export async function generateUsername(email: string, name?: string) {
  const usernameMatch = email.match(/^(.+)@/);

  if (!usernameMatch) {
    throw new Error("Invalid email format");
  }

  const originalUsername = usernameMatch[1];
  const cleanUsername = originalUsername?.replace(/[+.]/g, "");

  let username = cleanUsername;

  const userList = await searchUsers(username ?? "");

  // Check if the username is available in the list
  let isUsernameTaken = userList.some((user) => user.username === username);

  if (!isUsernameTaken) {
    return username;
  }

  // If not available, add an underscore and recheck
  username += "_";
  isUsernameTaken = userList.some((user) => user.username === username);

  if (!isUsernameTaken) {
    return username;
  }

  // If still not available, add "01" or increment a number
  let index = 1;
  while (isUsernameTaken) {
    index += 1;
    username = `${cleanUsername}${index.toString().padStart(2, "0")}`;
    isUsernameTaken = userList.some((user) => user.username === username);
  }

  return username;
}
