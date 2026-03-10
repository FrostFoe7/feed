"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

const OAuthLogin: React.FC = ({}) => {
  const [isLoading, setIsLoading] = React.useState<boolean | null>(null);

  async function oauthSignIn() {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl: "/account?origin=/" });
    } catch (error) {
      setIsLoading(false);
      console.error("OAuth login error:", error);
    }
  }

  return (
    <Button
      aria-label={`Continue with Google`}
      variant="outline"
      className="bg-transparent flex justify-center items-center py-5 px-3 rounded-xl transform active:scale-95 transition-transform cursor-pointer select-none h-16 w-full text-base hover:bg-transparent border-[#333333] text-white hover:text-white"
      onClick={() => void oauthSignIn()}
      disabled={isLoading !== null}
    >
      {isLoading ? (
        <Icons.spinner
          className="mr-2 h-4 w-4 animate-spin"
          aria-hidden="true"
        />
      ) : (
        <Icons.googleColor className="mr-2 h-4 w-4" aria-hidden="true" />
      )}
      Continue with Google
    </Button>
  );
};

export default OAuthLogin;
