"use client";

import React from "react";
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
  const isLikedByMe = likes?.some((like) => like.userId === loggedUser?.id);

  const [isLiked, setIsLiked] = React.useState(isLikedByMe);

  React.useEffect(() => {
    setIsLiked(isLikedByMe);
  }, [isLikedByMe]);

  const { mutate: toggleLike, isLoading } = api.like.toggleLike.useMutation({
    onMutate: () => {
      const previousLiked = isLiked;

      setIsLiked((prev) => !prev);

      return { previousLiked };
    },
    onError: (error, variables, context) => {
      setIsLiked(context?.previousLiked ?? isLiked);

      toast.error("Something went wrong!");
    },
  });

  return (
    <div className="flex items-center justify-center hover:bg-primary rounded-full p-2 w-fit h-fit active:scale-95">
      <button disabled={isLoading}>
        <Icons.heart
          onClick={() => {
            onLike(isLiked);
            toggleLike({ id });
          }}
          fill={isLiked ? "#ff3040" : "transparent"}
          className={cn("w-5 h-5 ", {
            "text-[#ff3040]": isLiked,
          })}
        />
      </button>
    </div>
  );
};

export default LikeButton;
