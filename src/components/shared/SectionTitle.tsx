import { cn } from "@/lib/utils";

interface SectionTitleProps {
  ornament?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function SectionTitle({
  ornament = "✦",
  title,
  subtitle,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn("text-center mb-12", className)}>
      {ornament && (
        <span className="text-script text-gold text-3xl block mb-4">
          {ornament}
        </span>
      )}
      <h2 className="text-display text-4xl md:text-5xl lg:text-6xl font-light text-burgundy mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-body text-lg md:text-xl text-burgundy/70 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      <div className="ornament-line mt-6 max-w-xs mx-auto">
        <span className="text-script text-gold text-2xl">✦</span>
      </div>
    </div>
  );
}
