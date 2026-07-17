// Shared label/value row used in detail drawers (was duplicated per workspace).
export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#D8E5EC] bg-white p-3">
      <p className="text-xs font-black uppercase text-[#596A76]">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-[#18232B]">{value}</p>
    </div>
  );
}
