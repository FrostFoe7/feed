"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { Icons } from "@/components/icons";
import { useTheme } from "next-themes";
import { ChevronRight, Sun, Moon, Monitor, ChevronLeft } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function NavigationMenu() {
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState<"main" | "appearance">("main");

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <DropdownMenu onOpenChange={(open) => !open && setView("main")}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center justify-center">
          <Icons.menu className="h-[24px] w-[24px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer active:scale-95" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-background shadow-[0_12px_24px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_24px_rgba(0,0,0,0.4)] z-999 rounded-2xl w-[240px] mt-2 p-2 border-none overflow-hidden"
      >
        {view === "main" ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setView("appearance");
              }}
              className="flex items-center justify-between px-4 py-3 cursor-pointer rounded-xl focus:bg-accent/50 group"
            >
              <span className="text-[15px] font-bold">Appearance</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </DropdownMenuItem>
            
            <Link href="/settings">
              <DropdownMenuItem className="flex items-center justify-between px-4 py-3 cursor-pointer rounded-xl focus:bg-accent/50">
                <span className="text-[15px] font-bold">Settings</span>
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator className="bg-border/40 my-1 mx-2" />

            <Link href="/saved">
              <DropdownMenuItem className="flex items-center justify-between px-4 py-3 cursor-pointer rounded-xl focus:bg-accent/50">
                <span className="text-[15px] font-bold">Saved</span>
              </DropdownMenuItem>
            </Link>

            <Link href="/liked">
              <DropdownMenuItem className="flex items-center justify-between px-4 py-3 cursor-pointer rounded-xl focus:bg-accent/50">
                <span className="text-[15px] font-bold">Liked</span>
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator className="bg-border/40 my-1 mx-2" />

            <DropdownMenuItem className="flex items-center justify-between px-4 py-3 cursor-pointer rounded-xl focus:bg-accent/50">
              <span className="text-[15px] font-bold">Report a problem</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => void handleSignOut()}
              className="flex items-center justify-between px-4 py-3 cursor-pointer rounded-xl focus:bg-accent/50"
            >
              <span className="text-[15px] font-bold text-red-500">Log out</span>
            </DropdownMenuItem>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-left-4 duration-200">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setView("main");
              }}
              className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-accent/50 rounded-xl mb-1 group"
            >
              <div className="p-1">
                <ChevronLeft className="h-5 w-5" />
              </div>
              <span className="text-[15px] font-bold">Appearance</span>
            </div>
            
            <DropdownMenuSeparator className="bg-border/40 my-1 mx-2" />

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setTheme("light");
              }}
              className="flex items-center justify-between px-4 py-3 cursor-pointer rounded-xl focus:bg-accent/50"
            >
              <span className={cn("text-[15px] font-bold", theme === "light" ? "text-foreground" : "text-muted-foreground")}>Light mode</span>
              <Sun className={cn("h-4 w-4", theme === "light" ? "text-foreground" : "text-muted-foreground")} />
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setTheme("dark");
              }}
              className="flex items-center justify-between px-4 py-3 cursor-pointer rounded-xl focus:bg-accent/50"
            >
              <span className={cn("text-[15px] font-bold", theme === "dark" ? "text-foreground" : "text-muted-foreground")}>Dark mode</span>
              <Moon className={cn("h-4 w-4", theme === "dark" ? "text-foreground" : "text-muted-foreground")} />
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setTheme("system");
              }}
              className="flex items-center justify-between px-4 py-3 cursor-pointer rounded-xl focus:bg-accent/50"
            >
              <span className={cn("text-[15px] font-bold", theme === "system" ? "text-foreground" : "text-muted-foreground")}>Auto</span>
              <Monitor className={cn("h-4 w-4", theme === "system" ? "text-foreground" : "text-muted-foreground")} />
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
