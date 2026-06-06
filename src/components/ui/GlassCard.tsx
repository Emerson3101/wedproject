import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  variant?: "default" | "strong" | "subtle";
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  childrenClassName?: string;
}

export default function GlassCard({
  children,
  variant = "default",
  className,
  padding = "md",
  childrenClassName,
}: GlassCardProps) {
  const variantClass = {
    default: "glass",
    strong: "glass-strong",
    subtle: "glass-subtle",
  }[variant];

  const paddingClass = {
    none: "",
    sm: "p-4",
    md: "p-6 md:p-8",
    lg: "p-8 md:p-12",
  }[padding];

  return (
    <div
      className={cn(variantClass, paddingClass, className)}
    >
      {children}
    </div>
  );
}
