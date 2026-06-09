"use client";

import { cn } from "@/lib/utils";

/* ============================================
   SKELETON — Placeholder con efecto shimmer
   Se usa mientras carga contenido real.
   ============================================ */

interface SkeletonProps {
  className?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

export default function Skeleton({
  className,
  animated = true,
  style,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-champagne/40",
        animated && "skeleton-shimmer",
        className
      )}
      style={style}
    />
  );
}

/* --------------------------------------------
   Skeleton composantes predefinidos
   -------------------------------------------- */

interface SkeletonTextProps {
  lines?: number;
}

export function SkeletonText({ lines = 3 }: SkeletonTextProps) {
  return (
    <div className="space-y-2 w-full">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 w-full"
          style={{
            width: `${85 - i * 15}%`,
            marginLeft: "auto",
          }}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  variant?: "song" | "default";
}

export function SkeletonCard({ variant = "default" }: SkeletonCardProps) {
  if (variant === "song") {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10">
        <Skeleton className="w-16 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-white/10 space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}
