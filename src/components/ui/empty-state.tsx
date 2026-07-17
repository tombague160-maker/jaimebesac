import type { LucideIcon } from "lucide-react";

// Shared empty state for lists/grids: distinguishes "no data" from "no results".
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
      {Icon ? <Icon className="h-6 w-6 text-muted-soft" /> : null}
      <p className="text-sm font-bold text-ink">{title}</p>
      {hint ? <p className="max-w-sm text-xs text-muted">{hint}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
