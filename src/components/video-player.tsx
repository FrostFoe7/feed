"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaMuteButton,
  MediaPlayButton,
} from "media-chrome/react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  className?: string;
  poster?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className, poster }) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry?.isIntersecting ?? false);
      },
      { threshold: 0.6 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden bg-black w-full h-full group", className)}
    >
      <MediaController className="w-full h-full">
        <ReactPlayer
          slot="media"
          url={src}
          playing={isIntersecting}
          muted={true}
          loop={true}
          playsinline={true}
          width="100%"
          height="100%"
          style={{ objectFit: "cover" }}
          light={poster}
        />
        
        {/* Custom Minimal Control Bar - visible on hover like Threads */}
        <MediaControlBar className="bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-0 left-0 right-0 h-12 flex items-center px-2">
          <MediaPlayButton className="text-white hover:bg-white/10 rounded-full" />
          <MediaMuteButton className="text-white hover:bg-white/10 rounded-full" />
          <MediaTimeRange className="flex-1 mx-2" />
        </MediaControlBar>
      </MediaController>
    </div>
  );
};

export default VideoPlayer;
