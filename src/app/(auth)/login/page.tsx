import LoginForm from "@/components/forms/login-form";
import OAuthLogin from "@/components/auth/oauth-login";
import Link from "next/link";
import React from "react";

export default function LoginPage() {
  return (
    <div className="max-w-[370px] mx-auto py-16 w-full text-center text-white text-base relative">
      <LoginForm />
      <div className="text-center text-[#777777] text-[15px] mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-white hover:underline">
          Sign up
        </Link>
      </div>
      <div className="text-center text-[#777777] text-[15px] mt-2">
        Forget password?
      </div>
      <div className="mt-6 space-y-5 ">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#393939]" />
          </div>
          <div className="relative flex justify-center text-xs items-center">
            <span className="bg-[#101010] px-3 text-white text-base">or</span>
          </div>
        </div>
        <OAuthLogin />
      </div>
    </div>
  );
}