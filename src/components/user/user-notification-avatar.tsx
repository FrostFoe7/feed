import React from "react";
import Link from "next/link";
type NotificationType =
  | "ADMIN"
  | "LIKE"
  | "REPLY"
  | "FOLLOW"
  | "REPOST"
  | "QUOTE";
import { Icons } from "@/components/icons";
import { cn, getOptimizedImageUrl } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserNotificationAvtarProps {
  username: string;
  image: string;
  fullname: string;
  type: NotificationType;
}

function enumToLower(enumValue: string): string {
  return enumValue.toLowerCase();
}

const getIcon = (typeName: string) => {
  switch (typeName) {
    case "QUOTE":
      return Icons.quote2;
    case "REPLY":
      return Icons.reply2;
    case "REPOST":
      return Icons.repost2;
    default:
      return Icons[enumToLower(typeName) as keyof typeof Icons];
  }
};

const NotificationIcon = ({
  type,
  className,
  fill,
}: {
  type: NotificationType;
  className?: string;
  fill?: string;
}) => {
  const Icon = getIcon(type);
  if (!Icon) return null;
  return React.createElement(Icon, { className, fill });
};

const UserNotificationAvtar: React.FC<UserNotificationAvtarProps> = ({
  username,
  image,
  fullname,
  type,
}) => {
  return (
    <Link href={`/@${username}`}>
      <div className="outline-solid outline-1 outline-border rounded-full ml-px">
        <Avatar className="h-10 w-10 relative overflow-visible cursor-pointer ">
          <AvatarImage
            src={getOptimizedImageUrl(image, 100)}
            alt={fullname}
            className="rounded-full w-full h-full object-cover"
          />
          <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
          <div
            className={cn(
              "absolute -bottom-1 -right-1 rounded-2xl border-2 border-background text-white",
              {
                "bg-[#fe0169]": type === "LIKE",
                "bg-[#6e3def]": type === "FOLLOW",
                "bg-[#24c3ff]": type === "REPLY",
                "bg-[#c329bf]": type === "REPOST",
                "bg-[#fe7900]": type === "QUOTE",
              },
            )}
          >
            {type !== "ADMIN" && (
              <NotificationIcon
                type={type}
                className="h-[20px] w-[20px]"
                fill="white"
              />
            )}
          </div>
        </Avatar>
      </div>
    </Link>
  );
};

export default UserNotificationAvtar;
