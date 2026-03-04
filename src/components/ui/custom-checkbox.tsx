"use client";

export function CustomCheckbox({
  checked,
  onChange,
  label,
  className = "",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`flex items-center gap-2 cursor-pointer select-none ${className}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all duration-150 ease-out flex-shrink-0 ${
          checked
            ? "bg-[#ff4000] border-[#ff4000] scale-100"
            : "border-[rgba(255,255,255,0.12)] bg-transparent hover:border-[rgba(255,255,255,0.2)]"
        }`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-white">
            <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {label != null && (
        <span className="text-[12px] text-[#888]">{label}</span>
      )}
    </label>
  );
}
