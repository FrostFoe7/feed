"use client";

import React, { useOptimistic, useTransition } from "react";
import { Follow } from "@/components/ui/follow-button";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import type { AuthorInfoProps } from "@/types";
import { useUser } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

interface FollowButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: string;
  author: AuthorInfoProps;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  variant,
  author,
  className,
}) => {
  const path = usePathname();

  const { user: loggedUser } = useUser();

  const isSameUser = author.id === loggedUser?.id;
  const isFollowedByMe =
    author.followers?.some((user) => user.id === loggedUser?.id) ?? false;

  const [optimisticFollowed, addOptimisticFollowed] = useOptimistic(
    isFollowedByMe,
    (state: boolean, newFollowState: boolean) => newFollowState,
  );
  const [isPending, startTransition] = useTransition();

  const trpcUtils = api.useUtils();

  const { mutateAsync: toggleFollow } = api.user.toggleFollow.useMutation({
    onError: () => {
      toast.error("FollowError: Something went wrong!");
    },
    onSettled: async () => {
      if (path === "/") {
        await trpcUtils.post.getInfinitePost.invalidate();
      }
      await trpcUtils.invalidate();
    },
  });

  const handleFollow = () => {
    const newState = !optimisticFollowed;
    startTransition(async () => {
      addOptimisticFollowed(newState);
      if (newState) {
        toast("Followed");
      } else {
        toast("Unfollowed");
      }
      try {
        await toggleFollow({ id: author.id });
      } catch {
        // useOptimistic automatically reverts
      }
    });
  };

  const setVariant = variant === "default" ? "default" : "outline";
  return (
    <Follow
      disabled={isPending || isSameUser}
      onClick={handleFollow}
      variant={!optimisticFollowed ? setVariant : "outline"}
      className={cn("rounded-xl py-1.5 px-4 select-none", className, {
        "opacity-80": optimisticFollowed,
      })}
    >
      {optimisticFollowed ? "Following" : "Follow"}
    </Follow>
  );
};

export default FollowButton;
