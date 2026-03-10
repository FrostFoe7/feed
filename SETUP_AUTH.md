# Setting Up Social Auth (Pure NextAuth)

This project uses **NextAuth's native Google Provider**. Authentication is handled entirely by NextAuth, and the user data is synchronized to the Appwrite database upon sign-in.

## 1. Get Google Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services** > **Credentials**.
4. Create an **OAuth 2.0 Client ID** (Type: Web application).
5. **Authorized JavaScript origins:**
   - `http://localhost:3000`
6. **Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret**.

## 2. Configure Environment Variables

Add the credentials to your `.env` or `.env.local`:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## 3. How it Works

1. User clicks "Continue with Google".
2. NextAuth handles the OAuth flow with Google directly.
3. On successful login, the `signIn` callback in `src/server/auth.ts` checks if the user exists in the Appwrite `users` collection.
4. If not, it creates a new user document using the Appwrite Admin SDK.
5. All database operations are performed via the Appwrite Admin Client, as there is no native Appwrite session for NextAuth Google users.
