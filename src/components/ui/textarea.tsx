"use client";

import { forwardRef } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(function Textarea({ className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 py-2 text-[13px] text-[#f2f2f2] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#ff4000] transition-all duration-150 ease-out w-full min-h-[180px] resize-none ${className}`}
      {...props}
    />
  );
});
