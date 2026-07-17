import { cn } from "@/lib/utils";

const controlClass =
  "h-10 min-w-0 max-w-full w-full rounded-lg border border-line bg-card px-3 text-sm text-ink outline-none transition placeholder:text-muted-soft focus:border-blue focus:ring-4 focus:ring-blue/15 hover:border-blue-soft";

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
        "min-h-28 min-w-0 max-w-full w-full resize-y rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted-soft focus:border-blue focus:ring-4 focus:ring-blue/15 hover:border-blue-soft",
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
    <label className={cn("text-xs font-bold text-muted", className)} {...props}>
      {children}
    </label>
  );
}
