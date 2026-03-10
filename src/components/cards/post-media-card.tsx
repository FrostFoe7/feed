"use client";

import React, { useState, useEffect } from "react";
import { useImageStore } from "@/store/image";
import { getOptimizedImageUrl, cn } from "@/lib/utils";
import Image from "next/image";
import VideoPlayer from "@/components/video-player";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

interface PostMediaCardProps {
  images: string[] | undefined;
}

const PostMediaCard: React.FC<PostMediaCardProps> = ({ images }) => {
  const { setImageUrl } = useImageStore();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    requestAnimationFrame(() => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap() + 1);
    });

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap() + 1);
    };

    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative mt-2.5 w-full">
      {/* 1/n Indicator */}
      {images.length > 1 && (
        <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1 text-[12px] font-medium text-white pointer-events-none">
          {current}/{count}
        </div>
      )}

      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: false }}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {images.map((url, index) => {
            const isVideo = url.includes("type=video");
            return (
              <CarouselItem
                key={index}
                className={cn(
                  "pl-0 pr-2",
                  images.length > 1 ? "basis-[88%]" : "basis-full",
                )}
              >
                <div
                  className="relative overflow-hidden rounded-[8px] border border-border w-full aspect-square flex items-center justify-center bg-black/5 cursor-pointer"
                  onClick={() => {
                    if (!isVideo) setImageUrl(url);
                  }}
                >
                  {isVideo ? (
                    <VideoPlayer src={url} className="w-full h-full object-cover" />
                  ) : (
                    <Image
                      loading="lazy"
                      src={getOptimizedImageUrl(url, 630)}
                      width={630}
                      height={630}
                      alt="Thread media"
                      className="object-cover w-full h-full"
                      unoptimized={url.startsWith("blob:")}
                    />
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {images.length > 1 && (
          <div className="hidden sm:block">
            <CarouselPrevious className="left-4 bg-white/10 border-none hover:bg-white/20 text-white backdrop-blur-md h-8 w-8" />
            <CarouselNext className="right-4 bg-white/10 border-none hover:bg-white/20 text-white backdrop-blur-md h-8 w-8" />
          </div>
        )}
      </Carousel>
    </div>
  );
};

export default PostMediaCard;
