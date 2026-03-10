"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const HomeTabs = () => {
  const pathname = usePathname();
  const isFollowing = pathname === "/following";

  return (
    <div className="flex w-full items-center justify-center bg-background/95 backdrop-blur-xl sticky top-[60px] sm:top-[74px] z-40 border-b border-border/50 -mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] px-4 sm:px-6">
      <div className="flex w-full max-w-[620px]">
        <Link
          href="/"
          aria-label="For you"
          className={cn(
            "relative flex-1 flex items-center justify-center py-4 transition-all duration-200",
            !isFollowing ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground font-semibold"
          )}
        >
          <span>For you</span>
          {!isFollowing && (
            <div className="absolute bottom-0 h-0.5 w-full bg-foreground" />
          )}
        </Link>
        <Link
          href="/following"
          aria-label="Following"
          className={cn(
            "relative flex-1 flex items-center justify-center py-4 transition-all duration-200",
            isFollowing ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground font-semibold"
          )}
        >
          <span>Following</span>
          {isFollowing && (
            <div className="absolute bottom-0 h-0.5 w-full bg-foreground" />
          )}
        </Link>
      </div>
    </div>
  );
};

export default HomeTabs;
