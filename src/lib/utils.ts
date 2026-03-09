import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as z from "zod";
import { toast } from "sonner";
import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserEmail(user: { email?: string } | null) {
  return user?.email ?? "";
}

export function emailToUsername(email: string) {
  const usernameMatch = email.match(/^(.+)@/);

  if (usernameMatch) {
    const username = usernameMatch[1]!;
    const newUsername = username.replace(/[+.]/g, "");
    return newUsername;
  } else {
    return email.split("@")[0] ?? "user";
  }
}

export function formatURL(originalURL: string) {
  const parsedUrl = new URL(originalURL);
  const domain = parsedUrl.hostname;
  const firstPath = parsedUrl.pathname.split("/")[1] ?? "";

  return `${domain}${firstPath ? `/${firstPath}` : ""}`;
}

export function catchError(err: unknown) {
  const unknownErr = "Something went wrong, please try again later.";

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => {
      return issue.message;
    });
    return toast(errors.join("\n"));
  } else if (err instanceof Error) {
    return toast.error(err.message);
  } else {
    return toast.error(unknownErr);
  }
}

export function formatTimeAgo(timestamp: Date): string {
  const now = new Date();
  const secondsDiff = differenceInSeconds(now, timestamp);
  const minutesDiff = differenceInMinutes(now, timestamp);
  const hoursDiff = differenceInHours(now, timestamp);
  const daysDiff = differenceInDays(now, timestamp);
  const weeksDiff = differenceInWeeks(now, timestamp);

  if (secondsDiff < 60) {
    return `${secondsDiff}s`;
  } else if (minutesDiff < 60) {
    return `${minutesDiff}m`;
  } else if (hoursDiff < 24) {
    return `${hoursDiff}h`;
  } else if (daysDiff < 7) {
    return `${daysDiff}d`;
  } else {
    return `${weeksDiff}w`;
  }
}

export function truncateText(text: string, maxLength: number) {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "...";
  } else {
    return text;
  }
}
