"use client";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "accent";

const variantClass: Record<BadgeVariant, string> = {
  default: "bg-[#1e1e1e] text-[#888] border border-[rgba(255,255,255,0.08)]",
  success: "bg-[rgba(62,207,142,0.1)] text-[#3ecf8e]",
  warning: "bg-[rgba(245,158,11,0.1)] text-[#f59e0b]",
  danger: "bg-[rgba(248,113,113,0.1)] text-[#f87171]",
  accent: "bg-[rgba(255,64,0,0.1)] text-[#ff4000]",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-[6px] ${variantClass[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
