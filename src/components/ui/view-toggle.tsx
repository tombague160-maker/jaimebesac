import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared view switcher button (was duplicated in clients/shootings/publications).
export function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition",
        active
          ? "border-[#9FD8F3] bg-[#E7F5FA] text-[#18232B]"
          : "border-[#D8E5EC] bg-white text-[#596A76] hover:text-[#18232B]",
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
