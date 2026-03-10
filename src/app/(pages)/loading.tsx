import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full max-w-[620px] mx-auto mt-4 flex flex-col gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
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
      ))}
    </div>
  );
}
