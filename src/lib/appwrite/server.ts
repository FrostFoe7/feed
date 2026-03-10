import "server-only";

import { Client, Databases, Storage, Users, ID, Query } from "node-appwrite";

export function createAdminClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      "Missing Appwrite environment variables (Endpoint, Project ID, or API Key). Check your .env file."
    );
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return {
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
    get users() {
      return new Users(client);
    },
  };
}

export { ID, Query };
