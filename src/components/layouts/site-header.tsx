"use client";

import React from "react";
import { Icons } from "@/components/icons";
import Navigation from "@/components/navigations";
import useWindow from "@/hooks/use-window";
import { cn } from "@/lib/utils";
import Link from "next/link";
import NavigationMenu from "@/components/menus/navigation-menu";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const { isMobile } = useWindow();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/" || pathname === "/following";
  const isFollowing = pathname === "/following";

  React.useEffect(() => {
    const changeBgColor = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", changeBgColor);
    return () => window.removeEventListener("scroll", changeBgColor);
  }, [isScrolled]);

  return (
    <header
      aria-label="Header"
      className={cn(
        "sticky top-0 z-100 w-full transition-all duration-200",
        isScrolled || (isHome && isMobile)
          ? "dark:bg-[#101010D9] bg-background/95 backdrop-blur-2xl border-b border-border/40"
          : "bg-transparent",
      )}
    >
      <nav className="sm:container sm:max-w-[1250px] px-4">
        <div className="relative py-1 flex w-full justify-between items-center z-50 max-h-[60px] sm:max-h-full h-full">
          <Link
            href={"/"}
            className="text-2xl font-semibold tracking-wide flex gap-2.5 items-center cursor-pointer active:scale-95 transform transition-all duration-150 ease-out hover:scale-105 z-50 w-full sm:w-fit py-4 justify-center"
          >
            <Icons.logo className="h-[34px] w-[34px]" />
          </Link>

          {/* Home Tabs Integrated in Header (Desktop) */}
          {isHome && (
            <div className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center h-full">
              <div className="flex items-center h-full">
                <Link
                  href="/"
                  className={cn(
                    "px-8 py-5 text-[15px] font-bold transition-colors relative flex items-center justify-center h-full",
                    !isFollowing ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="relative z-10">For you</span>
                  {!isFollowing && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
                  )}
                </Link>
                <Link
                  href="/following"
                  className={cn(
                    "px-8 py-5 text-[15px] font-bold transition-colors relative flex items-center justify-center h-full",
                    isFollowing ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="relative z-10">Following</span>
                  {isFollowing && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
                  )}
                </Link>
              </div>
            </div>
          )}

          <div className="hidden sm:flex justify-between items-center max-w-[480px] w-full ">
            {!isHome && <Navigation />}
          </div>
          {isMobile ? (
            <div className="absolute right-0 -translate-y-2/4 top-2/4 z-999">
              <NavigationMenu />
            </div>
          ) : (
            <NavigationMenu />
          )}
        </div>

        {/* Mobile Tabs (Seamless) */}
        {isHome && (
          <div className="flex sm:hidden">
            <Link
              href="/"
              className={cn(
                "flex-1 text-center py-3 text-[14px] font-bold relative",
                !isFollowing ? "text-foreground" : "text-muted-foreground"
              )}
            >
              For you
              {!isFollowing && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
              )}
            </Link>
            <Link
              href="/following"
              className={cn(
                "flex-1 text-center py-3 text-[14px] font-bold relative",
                isFollowing ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Following
              {isFollowing && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
              )}
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
