"use client";

export function CustomToggle<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`text-[13px] font-medium px-3 py-1.5 rounded-[8px] cursor-pointer transition-all duration-150 ease-out ${
            value === opt.value
              ? "text-[#f2f2f2] bg-[#1e1e1e] border border-[rgba(255,255,255,0.08)]"
              : "text-[#888] hover:text-[#f2f2f2] bg-transparent"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
