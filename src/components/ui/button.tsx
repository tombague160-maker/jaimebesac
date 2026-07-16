import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-[#18232B] bg-[#18232B] text-white shadow-[0_10px_24px_rgba(24,35,43,0.18)] hover:bg-[#24313A] hover:shadow-[0_14px_30px_rgba(24,35,43,0.22)]",
  secondary:
    "border-[#9FD8F3] bg-[#E7F5FA] text-[#18232B] shadow-[inset_0_-1px_0_rgba(94,173,211,0.2)] hover:bg-[#D7EDF7]",
  ghost:
    "border-transparent bg-transparent text-[#596A76] hover:bg-[#FBFAF2] hover:text-[#18232B]",
  danger: "border-[#F8C7D8] bg-[#FDEDF3] text-[#88415C] hover:bg-[#F8C7D8]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 py-1.5 text-xs leading-4",
  md: "min-h-10 px-4 py-2 text-sm leading-5",
  icon: "h-9 w-9 shrink-0 p-0",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-w-0 max-w-full shrink-0 items-center justify-center gap-2 whitespace-normal rounded-lg border text-center font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5EADD3]/20",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
