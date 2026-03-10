"use client";

import React from "react";
import Image from "next/image";
import useFileStore from "@/store/fileStore";
import { X } from "lucide-react";
import Username from "@/components/user/user-username";
import { ResizeTextarea } from "@/components/ui/resize-textarea";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/user/user-avatar";
import { useUser } from "@/components/providers/auth-provider";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { ParentPostInfo } from "@/types";
import PostQuoteCard from "@/components/cards/post-quote-card";
import PostMediaCard from "@/components/cards/post-media-card";
import { useDropzone, type Accept } from "react-dropzone";
import VideoPlayer from "@/components/video-player";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface CreatePostInputProps {
  isOpen: boolean;
  replyThreadInfo?: ParentPostInfo | null;
  onTextareaChange: (textValue: string) => void;
  quoteInfo?:
    | (Pick<ParentPostInfo, "id" | "text" | "author"> & { createdAt?: Date })
    | null;
}

interface PreviewFile {
  url: string;
  type: "image" | "video";
}

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.src = URL.createObjectURL(file);
  });
};

const CreatePostInput: React.FC<CreatePostInputProps> = ({
  isOpen,
  replyThreadInfo,
  onTextareaChange,
  quoteInfo,
}) => {
  const { user } = useUser();
  const { selectedFile, setSelectedFile } = useFileStore();

  const [inputValue, setInputValue] = React.useState("");

  const handleResizeTextareaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onTextareaChange(newValue);
  };

  const [previewFiles, setPreviewFiles] = React.useState<PreviewFile[]>([]);

  const maxSize = 50 * 1024 * 1024; // 50MB for videos

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      const validFiles: File[] = [];

      for (const file of acceptedFiles) {
        if (file.type.startsWith("video/")) {
          const duration = await getVideoDuration(file);
          if (duration > 59) {
            alert(`Video ${file.name} is longer than 59 seconds!`);
            continue;
          }
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      const newPreviews = validFiles.map((file) => ({
        url: URL.createObjectURL(file),
        type: (file.type.startsWith("video/") ? "video" : "image") as
          | "image"
          | "video",
      }));

      setPreviewFiles((prev) => [...prev, ...newPreviews]);
      setSelectedFile([...selectedFile, ...validFiles]);
    },
    [setSelectedFile, selectedFile],
  );

  const accept: Accept = {
    "image/*": [],
    "video/*": [],
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: true,
  });

  const scrollDownRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    scrollDownRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }, [isOpen]);

  const removeFile = (index: number) => {
    const newPreviews = [...previewFiles];
    const previewToRemove = newPreviews[index];
    if (previewToRemove) {
      URL.revokeObjectURL(previewToRemove.url);
    }
    newPreviews.splice(index, 1);
    setPreviewFiles(newPreviews);

    const newFiles = [...selectedFile];
    newFiles.splice(index, 1);
    setSelectedFile(newFiles);
  };

  React.useEffect(() => {
    if (!isOpen) {
      previewFiles.forEach((file) => URL.revokeObjectURL(file.url));
      setPreviewFiles([]);
    }
  }, [isOpen, previewFiles]);

  return (
    <div
      className={cn("flex space-x-3", {
        "mt-1": !replyThreadInfo,
      })}
    >
      <div className="relative flex flex-col items-center">
        {replyThreadInfo ? (
          <UserAvatar
            image={replyThreadInfo.author.image}
            username={replyThreadInfo.author.username}
            fullname={replyThreadInfo.author.fullname}
          />
        ) : (
          <UserAvatar
            image={user?.imageUrl}
            username={user?.username ?? ""}
            fullname={user?.fullName}
          />
        )}

        {replyThreadInfo?.text && (
          <div className="h-full w-0.5 bg-[#D8D8D8] dark:bg-[#313639] rounded-full mt-1.5 my-1" />
        )}
      </div>

      <div className="flex flex-col w-full gap-1.5 pb-4">
        {replyThreadInfo ? (
          <div className="flex">
            <Username author={replyThreadInfo?.author} />

            {/* TODO: This is temp solution to maintain layout */}
            <div className="w-3 h-3 invisible">
              <Icons.verified className="w-3 h-3" />
            </div>
          </div>
        ) : (
          <span className="text-[15px] font-medium leading-none tracking-normal">
            {user?.username}
          </span>
        )}

        {replyThreadInfo ? (
          <>
            <div className="grow resize-none overflow-hidden outline-hidden text-[15px] text-accent-foreground wrap-break-word placeholder:text-[#777777] w-full tracking-normal whitespace-pre-line">
              <div
                dangerouslySetInnerHTML={{
                  __html: replyThreadInfo.text
                    .slice(1, -1)
                    .replace(/\\n/g, "\n"),
                }}
              />
            </div>
            {replyThreadInfo?.images && replyThreadInfo?.images?.length > 0 && (
              <PostMediaCard images={replyThreadInfo.images} />
            )}
          </>
        ) : (
          <>
            <ResizeTextarea
              name="text"
              value={inputValue}
              onChange={handleResizeTextareaChange}
              placeholder="Start a thread..."
              maxLength={200}
            />
            {previewFiles.length > 0 && (
              <div className="mt-3 w-full">
                <Carousel className="w-full">
                  <CarouselContent>
                    {previewFiles.map((file, index) => (
                      <CarouselItem key={index} className="basis-full">
                        <div className="relative overflow-hidden rounded-[12px] border border-border w-full aspect-square flex items-center justify-center bg-black/5">
                          {file.type === "image" ? (
                            <Image
                              src={file.url}
                              alt="Preview"
                              width={1000}
                              height={1000}
                              unoptimized
                              className="object-cover w-full h-full rounded-[12px]"
                            />
                          ) : (
                            <VideoPlayer src={file.url} className="w-full h-full object-cover" />
                          )}
                          <Button
                            onClick={() => removeFile(index)}
                            variant={"ghost"}
                            className="h-6 w-6 p-1 absolute top-2 right-2 z-50 rounded-full transform active:scale-75 transition-transform cursor-pointer bg-background"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {previewFiles.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </>
                  )}
                </Carousel>
              </div>
            )}
          </>
        )}

        {!replyThreadInfo?.text && (
          <div
            {...getRootProps()}
            ref={scrollDownRef}
            className="space-y-2 mt-1 select-none w-fit"
          >
            <div className="text-[#777777] flex gap-1 select-none items-center text-[15px]">
              <input {...getInputProps()} />
              <Icons.image className="h-5 w-5 select-none transform active:scale-75 transition-transform cursor-pointer" />
            </div>
          </div>
        )}

        {quoteInfo && (
          <PostQuoteCard {...quoteInfo} createdAt={quoteInfo.createdAt} />
        )}
      </div>
    </div>
  );
};

export default CreatePostInput;
