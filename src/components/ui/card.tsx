import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("premium-card min-w-0", className)}>{children}</div>;
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("min-w-0 border-b border-[#D8E5EC] p-4", className)}>{children}</div>;
}

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("min-w-0 p-4", className)}>{children}</div>;
}
