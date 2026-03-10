"use client";

import React from "react";
import { api } from "@/trpc/react";
import PostCard from "@/components/cards/post-card";
import Loading from "@/app/(pages)/loading";
import Error from "@/app/error";
import InfiniteScroll from "react-infinite-scroll-component";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import StarOnGithub from "@/components/star-on-github";
import useDialog from "@/store/dialog";
import CreateWithInput from "@/components/create-with-input";
import { Skeleton } from "@/components/ui/skeleton";
import HomeTabs from "@/components/home-tabs";

const FollowingPage: React.FC = () => {
  const { setOpenDialog } = useDialog();

  // For UI demonstration, we'll use the same posts for both tabs for now
  const { data, isLoading, isError, hasNextPage, fetchNextPage } =
    api.post.getInfinitePost.useInfiniteQuery(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        trpc: { abortOnUnmount: true },
        staleTime: 10 * 60 * 1000,
      },
    );

  const allPosts = data?.pages.flatMap((page) => page.posts);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  return (
    <>
      <div className="w-full sm:flex hidden mt-6">
        <CreateWithInput onClick={() => setOpenDialog(true)} />
      </div>
      <InfiniteScroll
        dataLength={allPosts?.length ?? 0}
        next={fetchNextPage}
        hasMore={hasNextPage ?? false}
        loader={
          <div className="mb-[10vh] sm:mb-0 w-full flex flex-col gap-6 py-6">
            <div className="flex gap-4">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between w-full">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-32 w-full rounded-xl mt-2" />
              </div>
            </div>
          </div>
        }
      >
        <div>
          {allPosts?.map((post, index) => {
            return (
              <div
                key={index}
                className={cn({ "mb-[10vh]": index == allPosts.length - 1 })}
              >
                <PostCard {...post} />
                {index !== allPosts.length - 1 && <Separator />}
              </div>
            );
          })}
        </div>
      </InfiniteScroll>
      <div className="fixed bottom-10 left-[8%] rounded-full py-6 px-8">
        <StarOnGithub />
      </div>
    </>
  );
};

export default FollowingPage;
