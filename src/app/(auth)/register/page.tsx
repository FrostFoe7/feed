import RegisterForm from "@/components/forms/register-form";
import OAuthLogin from "@/components/auth/oauth-login";
import Link from "next/link";
import React from "react";

export default function RegisterPage() {
  return (
    <div className="max-w-[370px] mx-auto py-16 w-full text-center text-white relative">
      <h1 className="text-2xl font-bold mb-6">Create an account</h1>
      <RegisterForm />
      <div className="text-center text-[#777777] text-[15px] mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-white hover:underline">
          Log in
        </Link>
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
