"use client";

import React, { useOptimistic, useTransition } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useUser } from "@/components/providers/auth-provider";
import type { PostCardProps } from "@/types";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface LikeButtonProps {
  likeInfo: Pick<PostCardProps, "id" | "likes" | "count">;
  onLike: (isLiked: boolean) => void;
}

const LikeButton: React.FC<LikeButtonProps> = ({ likeInfo, onLike }) => {
  const { user: loggedUser } = useUser();

  const { id, likes } = likeInfo;
  const isLikedByMe =
    likes?.some((like) => like.userId === loggedUser?.id) ?? false;

  const [optimisticLike, addOptimisticLike] = useOptimistic(
    isLikedByMe,
    (state: boolean, newLikeState: boolean) => newLikeState,
  );

  const [isPending, startTransition] = useTransition();
  const trpcUtils = api.useUtils();

  const { mutateAsync: toggleLike } = api.like.toggleLike.useMutation({
    onSuccess: () => {
      trpcUtils.post.getInfinitePost.invalidate();
    },
    onError: () => {
      toast.error("Something went wrong!");
    },
  });

  const handleLike = () => {
    const newState = !optimisticLike;
    onLike(optimisticLike);
    startTransition(async () => {
      addOptimisticLike(newState);
      try {
        await toggleLike({ id });
      } catch {
        // error handled in onError, optimistic state reverts automatically
      }
    });
  };

  return (
    <div className="flex items-center justify-center hover:bg-primary rounded-full p-2 w-fit h-fit active:scale-95">
      <button disabled={isPending} onClick={handleLike}>
        <Icons.heart
          fill={optimisticLike ? "#ff3040" : "transparent"}
          className={cn("w-5 h-5 ", {
            "text-[#ff3040]": optimisticLike,
          })}
        />
      </button>
    </div>
  );
};

export default LikeButton;
