"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}: {
  value: T | "";
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label = value ? options.find((o) => o.value === value)?.label ?? placeholder : placeholder;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 py-2 text-[13px] text-[#f2f2f2] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#ff4000] transition-all duration-150 flex items-center justify-between gap-2"
      >
        <span className={value ? "" : "text-[#4a4a4a]"}>{label}</span>
        <ChevronDown className="w-4 h-4 text-[#4a4a4a] flex-shrink-0" strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#1e1e1e] border border-[rgba(255,255,255,0.08)] rounded-[10px] shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[#262626] cursor-pointer transition-all duration-150 ${
                value === opt.value ? "text-[#ff4000]" : "text-[#f2f2f2]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
