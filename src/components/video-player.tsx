"use client";

import React, { useEffect, useRef, useState } from "react";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { MediaPlayer, MediaProvider, Poster, type MediaPlayerInstance } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  className?: string;
  poster?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className, poster }) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<MediaPlayerInstance>(null);

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

  useEffect(() => {
    if (!playerRef.current) return;

    if (isIntersecting) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [isIntersecting]);

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden bg-black w-full h-full group", className)}
    >
      <MediaPlayer
        ref={playerRef}
        src={src}
        className="w-full h-full"
        playsInline
        muted
        loop
        crossOrigin
        load="visible"
      >
        <MediaProvider className="w-full h-full">
          {poster && <Poster src={poster} alt="Video Poster" className="vds-poster" />}
        </MediaProvider>
        
        <DefaultVideoLayout 
          icons={defaultLayoutIcons} 
          className="vds-layout transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        />
      </MediaPlayer>
    </div>
  );
};

export default VideoPlayer;
