"use client";

import { Search } from "lucide-react";

export function SearchInput({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#4a4a4a]" strokeWidth={1.5} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[8px] pl-8 pr-3 py-2 text-[13px] text-[#f2f2f2] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#ff4000] transition-all duration-150 w-full"
        {...props}
      />
    </div>
  );
}
