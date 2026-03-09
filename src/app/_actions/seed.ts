"use server";

import {
  getUserById,
  createManyUsers,
  createManyPosts,
  createManyNotifications,
  getFakeUserIds,
  deleteFakeUsersFromDb,
} from "@/lib/appwrite/db";
import { getLoggedInUser } from "@/lib/appwrite/session";
import { faker } from "@faker-js/faker";

export async function checkAdmin() {
  const user = await getLoggedInUser();
  if (!user) return { success: false };

  const dbUser = await getUserById(user.$id);
  if (!dbUser || !dbUser.isAdmin || !dbUser.verified) return { success: false };

  return { success: true };
}

export async function createFakeUsers() {
  const isAdmin = await checkAdmin();

  if (!isAdmin.success) return null;

  const usersToCreate = [];

  for (let i = 1; i <= 100; i++) {
    const id = faker.string.nanoid(11);
    const username = faker.internet.username();
    const fullname = faker.person.fullName();
    const email = faker.internet.email();
    const image = faker.image.avatarGitHub();
    const bio = faker.lorem.sentence();
    const link = faker.internet.url();

    usersToCreate.push({
      id,
      username,
      fullname,
      email,
      image,
      bio,
      link,
    });
  }

  const alldata = await createManyUsers(usersToCreate);

  return alldata;
}

export async function getUsersId() {
  const isAdmin = await checkAdmin();

  if (!isAdmin.success) return null;

  return await getFakeUserIds();
}

export async function createFakePost() {
  const isAdmin = await checkAdmin();

  if (!isAdmin.success) return null;

  const userIds = await getUsersId();

  if (!userIds) {
    return { success: false, error: "User information not available." };
  }

  const posts = [];
  for (const userId of userIds) {
    const newPost = {
      authorId: userId,
      text: faker.lorem.sentence(),
    };

    posts.push(newPost);
  }

  await createManyPosts(posts);

  return { success: true };
}

export async function createFakeNotifications() {
  const isAdmin = await checkAdmin();

  if (!isAdmin.success) return null;

  const user = await getLoggedInUser();
  const userIds = await getUsersId();

  if (!userIds) {
    return { success: false, error: "User information not available." };
  }

  const notifications = [];
  for (const userId of userIds) {
    const newNotification = {
      type: "LIKE",
      message: '"Your message here"',
      senderUserId: userId,
      receiverUserId: user?.$id,
    };

    notifications.push(newNotification);
  }

  await createManyNotifications(notifications);

  return { success: true };
}

export async function deleteFakeUsers() {
  const isAdmin = await checkAdmin();

  if (!isAdmin.success) return null;

  const alldata = await deleteFakeUsersFromDb();

  return alldata;
}
