import { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  hasOwnBg?: boolean;
}

function Skeleton({ className, hasOwnBg = true, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded ${hasOwnBg ? "bg-surface" : ""}
        ${className ?? ""}`}
      {...props}
    />
  );
}

export { Skeleton };
