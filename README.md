# [Threads clone](https://threads.codebustar.com)

This is an open source **threads-clone** build with **_`create-t3-app`_** and everything new in Next.js 13 and 14.

|                        1. Feed Page                        |                          2. Search Page                           |
| :--------------------------------------------------------: | :---------------------------------------------------------------: |
|      ![Feed Page](./public/screenshots/feed-page.png)      |       ![Search Page](./public/screenshots/search-page.png)        |
|                       3. Reply Card                        |                       4. Notifications Page                       |
|     ![Reply Card](./public/screenshots/reply-card.png)     | ![Notifications Page](./public/screenshots/notification-page.png) |
|                     5. Post Info Page                      |                          6. Profile Page                          |
| ![Post Info Page](./public/screenshots/post-info-page.png) |      ![Profile Page](./public/screenshots/profile-page.png)       |

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org)
- **Language:** [Typescript](https://www.typescriptlang.org/docs/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **Backend:** [AppWrite](https://appwrite.io) (Auth, Database, Storage)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com)
- **Typesafe APIs:** [tRPC](https://trpc.io)
- **Hosting:** [Vercel](https://vercel.com/)

## Key Features

- Authentication with **AppWrite** (Email/Password + Google OAuth)
- File uploads with **AppWrite Storage**
- Document-based database with **AppWrite**
- Validation with **Zod**
- Text filteration with **bad-words**
- Custom notifications on user interactions
- Custom component on top of **shadcn/ui**
- Recursive thread chains
- **_...and many more !_**

## Running Locally

1. Clone the repository

   ```bash
   git clone https://github.com/sujjeee/threads-clone.git
   ```

2. Install dependencies using pnpm

   ```bash
   pnpm install
   ```

3. Copy the `.env.example` to `.env` and update the variables.

   ```bash
   cp .env.example .env
   ```

4. Start the development server

   ```bash
   pnpm run dev
   ```

5. Set up AppWrite

   Create an AppWrite project at [cloud.appwrite.io](https://cloud.appwrite.io) and configure
   the database collections, storage bucket, and API keys as described in `.env.example`.
