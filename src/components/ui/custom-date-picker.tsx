"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";

export function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  showTime = false,
  className = "",
  placement = "bottom",
}: {
  value: Date | null;
  onChange: (d: Date | null) => void;
  placeholder?: string;
  showTime?: boolean;
  className?: string;
  /** "top" = open above trigger (e.g. in bottom bar), "bottom" = open below */
  placement?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(value ?? new Date());
  const [hours, setHours] = useState(value ? value.getHours() : 12);
  const [minutes, setMinutes] = useState(value ? value.getMinutes() : 0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const start = startOfWeek(startOfMonth(viewMonth));
  const end = endOfWeek(endOfMonth(viewMonth));
  const days: Date[] = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }

  const pickDay = (day: Date) => {
    const base = new Date(day);
    if (showTime) {
      base.setHours(hours, minutes, 0, 0);
    }
    onChange(base);
    if (!showTime) setOpen(false);
  };

  const applyTime = () => {
    const base = value ? new Date(value) : new Date();
    base.setHours(hours, minutes, 0, 0);
    onChange(base);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 py-2 text-[13px] text-[#f2f2f2] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#ff4000] transition-all duration-150 text-left"
      >
        {value ? (showTime ? format(value, "MMM d, yyyy h:mm a") : format(value, "MMM d, yyyy")) : placeholder}
      </button>
      {open && (
        <div
          className={`absolute left-0 z-50 bg-[#1e1e1e] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-4 shadow-xl min-w-[280px] ${
            placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="p-1 rounded-[8px] hover:bg-[#262626] transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-[#888]" strokeWidth={1.5} />
            </button>
            <span className="text-[13px] font-semibold text-[#f2f2f2]">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="p-1 rounded-[8px] hover:bg-[#262626] transition-all"
            >
              <ChevronRight className="w-4 h-4 text-[#888]" strokeWidth={1.5} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((wd) => (
              <div key={wd} className="text-[10px] text-[#4a4a4a] font-medium text-center py-1">
                {wd}
              </div>
            ))}
            {days.map((day) => (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => pickDay(day)}
                className={`w-8 h-8 rounded-[8px] text-[12px] transition-all duration-150 ${
                  value && isSameDay(day, value)
                    ? "bg-[#ff4000] text-white"
                    : isToday(day)
                    ? "border border-[rgba(255,255,255,0.12)] text-[#f2f2f2] hover:bg-[#262626]"
                    : !isSameMonth(day, viewMonth)
                    ? "text-[#4a4a4a] hover:bg-[#262626]"
                    : "text-[#f2f2f2] hover:bg-[#262626]"
                }`}
              >
                {format(day, "d")}
              </button>
            ))}
          </div>
          {showTime && (
            <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
              <input
                type="number"
                min={0}
                max={23}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value) % 24)}
                className="w-12 bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[6px] px-2 py-1 text-[12px] text-[#f2f2f2] text-center"
              />
              <span className="text-[#4a4a4a]">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) % 60)}
                className="w-12 bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[6px] px-2 py-1 text-[12px] text-[#f2f2f2] text-center"
              />
              <button
                type="button"
                onClick={applyTime}
                className="ml-auto bg-[#ff4000] hover:bg-[#e63900] text-white text-[12px] font-medium px-3 py-1 rounded-[6px]"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
