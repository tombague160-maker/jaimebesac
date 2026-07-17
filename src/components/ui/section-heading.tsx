import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  eyebrow,
  action,
  className,
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-black uppercase text-eyebrow">{eyebrow}</p> : null}
        <h2 className="text-xl font-black text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}
