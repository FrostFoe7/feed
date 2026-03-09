"use client";

import * as React from "react";
import { handleOAuthCallback } from "@/lib/appwrite/auth-actions";
import { Icons } from "@/components/icons";
import { useRouter } from "next/navigation";
import { type SSOCallbackPageProps } from "@/app/(auth)/sso-callback/page";

export default function SSOCallback({ searchParams }: SSOCallbackPageProps) {
  const router = useRouter();

  React.useEffect(() => {
    async function handleCallback() {
      const { userId, secret } = searchParams;
      if (userId && secret) {
        try {
          await handleOAuthCallback(userId, secret);
          router.push("/");
        } catch (error) {
          console.error("OAuth callback error:", error);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    }

    void handleCallback();
  }, [searchParams, router]);

  return (
    <div
      role="status"
      aria-label="Loading"
      aria-describedby="loading-description"
      className="flex items-center justify-center"
    >
      <Icons.spinner className="h-16 w-16 animate-spin" aria-hidden="true" />
    </div>
  );
}
