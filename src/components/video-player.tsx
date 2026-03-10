"use client";

import React, { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { PlayIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  className?: string;
  poster?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className, poster }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize Video.js
  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = document.createElement("video");
    videoElement.className = "video-js vjs-big-play-centered w-full h-full object-cover";
    videoRef.current.appendChild(videoElement);

    const player = playerRef.current = videojs(videoElement, {
      autoplay: false,
      controls: false,
      responsive: true,
      fluid: true,
      muted: true,
      loop: true,
      playsinline: true,
      sources: [{ src, type: "video/mp4" }],
      poster: poster,
    });

    player.on("pause", () => setIsPaused(true));
    player.on("play", () => setIsPaused(false));
    player.on("volumechange", () => setIsMuted(player.muted() ?? true));
    
    // Track progress reactively
    player.on("timeupdate", () => {
      const duration = player.duration();
      const currentTime = player.currentTime();
      if (duration && duration > 0 && currentTime !== undefined) {
        setProgress((currentTime / duration) * 100);
      }
    });

    return () => {
      if (player) {
        player.dispose();
      }
    };
  }, [src, poster]);

  // Autoplay Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry?.isIntersecting ?? false);
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playerRef.current) return;
    if (isIntersecting) {
      playerRef.current.play()?.catch(() => {});
    } else {
      playerRef.current.pause();
    }
  }, [isIntersecting]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    if (playerRef.current.paused()) {
      playerRef.current.play()?.catch(() => {});
    } else {
      playerRef.current.pause();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    const newMuteState = !playerRef.current.muted();
    playerRef.current.muted(newMuteState);
    setIsMuted(newMuteState);
  };

  return (
    <div 
      className={cn(
        "relative w-full h-full overflow-hidden rounded-[8px] bg-black group",
        className
      )}
      onClick={togglePlay}
    >
      {/* Video Container */}
      <div ref={videoRef} className="w-full h-full pointer-events-none" />

      {/* Center Play Button Overlay (Visible when paused) */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-black/40 text-white backdrop-blur-md transition-transform scale-100 group-hover:scale-110">
            <PlayIcon className="w-8 h-8 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Seeker / Progress Bar (Minimal line at bottom) */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20 overflow-hidden">
        <div 
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Bottom Right Mute/Unmute Toggle (Instagram/Threads Style) */}
      <button 
        onClick={toggleMute}
        className="absolute bottom-3 right-3 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-colors"
      >
        {isMuted ? (
          <VolumeXIcon className="w-4 h-4" />
        ) : (
          <Volume2Icon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default VideoPlayer;
