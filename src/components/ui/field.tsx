import { cn } from "@/lib/utils";

const controlClass =
  "h-10 min-w-0 max-w-full w-full rounded-lg border border-[#D8E5EC] bg-white px-3 text-sm text-[#18232B] outline-none transition placeholder:text-[#8697A2] focus:border-[#5EADD3] focus:ring-4 focus:ring-[#5EADD3]/15 hover:border-[#9FD8F3]";

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 min-w-0 max-w-full w-full resize-y rounded-lg border border-[#D8E5EC] bg-white px-3 py-2 text-sm text-[#18232B] outline-none transition placeholder:text-[#8697A2] focus:border-[#5EADD3] focus:ring-4 focus:ring-[#5EADD3]/15 hover:border-[#9FD8F3]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("text-xs font-bold text-[#596A76]", className)} {...props}>
      {children}
    </label>
  );
}
