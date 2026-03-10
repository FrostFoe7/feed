/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import type { Models } from "appwrite";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";

type AppWriteAuthUser = Models.User<Models.Preferences> & {
  /** Mapped from AppWrite account $id */
  id: string;
  /** Mapped from AppWrite account name */
  firstName: string | null;
  lastName: string | null;
  /** Full name combined */
  fullName: string | null;
  /** Profile image URL (from prefs or null) */
  imageUrl: string | null;
  username: string | null;
};

interface AuthContextValue {
  user: AppWriteAuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  isLoaded: false,
  isSignedIn: false,
  refreshUser: async () => {},
});

export function useUser() {
  return React.useContext(AuthContext);
}

export function AppWriteAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [user, setUser] = React.useState<AppWriteAuthUser | null>(null);
  const isLoaded = status !== "loading";

  // Use tRPC to get the full user data from the DB once we have a session
  const { data: dbUser, refetch } = api.user.getMe.useQuery(undefined, {
    enabled: !!session?.user,
  });

  React.useEffect(() => {
    if (session?.user && dbUser) {
      setUser({
        ...dbUser,
        id: dbUser.$id,
        firstName: dbUser.fullname?.split(" ")[0] || null,
        lastName: dbUser.fullname?.split(" ").slice(1).join(" ") || null,
        fullName: dbUser.fullname,
        imageUrl: dbUser.image,
        prefs: {},
      } as any);
    } else if (status === "unauthenticated") {
      setUser(null);
    }
  }, [session, dbUser, status]);

  const value = React.useMemo(
    () => ({
      user,
      isLoaded,
      isSignedIn: !!user,
      refreshUser: async () => {
        await refetch();
      },
    }),
    [user, isLoaded, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
