import React, { useOptimistic, useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { AuthorInfoProps } from "@/types";
import QuoteButton from "@/components/buttons/quote-button";

interface RepostButtonProps {
  id: string;
  text: string;
  author: AuthorInfoProps;
  isRepostedByMe: boolean;
  createdAt?: Date;
}

const RepostButton: React.FC<RepostButtonProps> = ({
  id,
  text,
  author,
  createdAt,
  isRepostedByMe,
}) => {
  const [optimisticReposted, addOptimisticReposted] = useOptimistic(
    isRepostedByMe,
    (state: boolean, newRepostState: boolean) => newRepostState
  );
  const [isPending, startTransition] = useTransition();

  const trpcUtils = api.useUtils();

  const { mutateAsync: toggleRepost } = api.post.toggleRepost.useMutation(
    {
      onSuccess: () => {
        trpcUtils.post.getInfinitePost.invalidate();
      },
      onError: () => {
        toast.error("RepostError: Something went wrong!");
      },
    },
  );

  const handleRepost = () => {
    const newState = !optimisticReposted;
    startTransition(async () => {
      addOptimisticReposted(newState);
      if (newState) {
        toast("Reposted");
      } else {
        toast("Removed");
      }
      try {
        await toggleRepost({ id });
      } catch {
        // useOptimistic auto reverts on failure since base state is unchanged
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isPending}
          className="flex items-center justify-center hover:bg-primary rounded-full p-2 w-fit h-fit active:scale-95 outline-hidden"
        >
          {optimisticReposted ? (
            <Icons.reposted className="w-5 h-5 " />
          ) : (
            <Icons.repost className="w-5 h-5 " />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="bg-background shadow-xl dark:bg-[#181818] rounded-2xl w-[190px] p-0"
      >
        <DropdownMenuItem
          disabled={isPending}
          onClick={handleRepost}
          className={cn(
            "focus:bg-transparent px-4 tracking-normal select-none font-semibold py-3 cursor-pointer text-[15px]  active:bg-primary-foreground  rounded-none w-full justify-between",
            {
              "text-red-600 focus:text-red-600": optimisticReposted,
            },
          )}
        >
          {optimisticReposted ? <>Remove</> : <>Repost</>}

          <Icons.repost
            className={cn("w-5 h-5 ", {
              "text-red-600": optimisticReposted,
            })}
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator className=" h-[1.2px] my-0" />
        <div className="focus:bg-transparent px-4 tracking-normal select-none font-semibold py-3 cursor-pointer text-[15px] rounded-none active:bg-primary-foreground  w-full justify-between">
          <QuoteButton
            quoteInfo={{
              text,
              id,
              author,
              createdAt,
            }}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RepostButton;
