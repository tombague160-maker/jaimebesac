import { cn } from "@/lib/utils";
import type { VisualConfig } from "@/lib/constants";

interface BadgeProps {
  config?: VisualConfig;
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ config, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-full items-center justify-center gap-1 break-words rounded-full border border-white/70 px-2.5 py-1 text-center text-xs font-bold leading-4 whitespace-normal shadow-[inset_0_-1px_0_rgba(24,35,43,0.06)]",
        className,
      )}
      style={{
        backgroundColor: config?.bg ?? "#FBFAF2",
        color: config?.color ?? "#596A76",
      }}
    >
      {children ?? config?.label}
    </span>
  );
}
