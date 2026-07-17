import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Shared metric tile (was duplicated in every workspace screen).
export function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#596A76]">{label}</p>
          <p className="mt-2 text-2xl font-black text-[#18232B]">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-[#5EADD3]" />
      </CardContent>
    </Card>
  );
}
