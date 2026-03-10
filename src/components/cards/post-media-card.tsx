"use client";

import React from "react";
import { useImageStore } from "@/store/image";
import { getOptimizedImageUrl } from "@/lib/utils";
import Image from "next/image";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

interface PostMediaCardProps {
  images: string[] | undefined;
}

const PostMediaCard: React.FC<PostMediaCardProps> = ({ images }) => {
  const { setImageUrl } = useImageStore();

  if (!images || images.length === 0) return null;

  return (
    <div className="relative mt-2.5 w-full">
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((url, index) => {
            const isVideo = url.includes("type=video");
            return (
              <CarouselItem key={index} className="basis-full">
                <div
                  className="relative overflow-hidden rounded-[12px] border border-border w-full aspect-square flex items-center justify-center bg-black/5 cursor-pointer"
                  onClick={() => {
                    if (!isVideo) setImageUrl(url);
                  }}
                >
                  {isVideo ? (
                    <MediaPlayer
                      src={url}
                      className="w-full h-full"
                      style={{ objectFit: "cover" }}
                    >
                      <MediaProvider />
                      <DefaultVideoLayout icons={defaultLayoutIcons} />
                    </MediaPlayer>
                  ) : (
                    <Image
                      loading="lazy"
                      src={getOptimizedImageUrl(url, 630)}
                      width={630}
                      height={630}
                      alt="Thread media"
                      className="object-cover w-full h-full rounded-[12px]"
                      unoptimized={url.startsWith("blob:")}
                    />
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>
    </div>
  );
};

export default PostMediaCard;
