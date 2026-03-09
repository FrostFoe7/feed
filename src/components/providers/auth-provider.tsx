"use client";

import React from "react";
import { account } from "@/lib/appwrite/client";
import type { Models } from "appwrite";

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

function mapAccountToUser(
  acct: Models.User<Models.Preferences>,
): AppWriteAuthUser {
  const nameParts = (acct.name ?? "").split(" ");
  const firstName = nameParts[0] ?? null;
  const lastName = nameParts.slice(1).join(" ") || null;
  const prefs = acct.prefs as Record<string, string | undefined>;
  return {
    ...acct,
    id: acct.$id,
    firstName,
    lastName,
    fullName: acct.name || null,
    imageUrl: prefs.imageUrl ?? null,
    username: prefs.username ?? acct.email?.split("@")[0] ?? null,
  };
}

export function AppWriteAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = React.useState<AppWriteAuthUser | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const fetchUser = React.useCallback(async () => {
    try {
      const acct = await account.get();
      setUser(mapAccountToUser(acct));
    } catch {
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const value = React.useMemo(
    () => ({
      user,
      isLoaded,
      isSignedIn: !!user,
      refreshUser: fetchUser,
    }),
    [user, isLoaded, fetchUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
