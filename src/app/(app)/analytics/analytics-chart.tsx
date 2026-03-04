"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { EmailsOverTimePoint } from "@/lib/analytics";
import { format, parseISO } from "date-fns";

export function AnalyticsChart({
  data,
  range,
}: {
  data: EmailsOverTimePoint[];
  range: "7d" | "30d" | "90d";
}) {
  const slice = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const shown = data.slice(-slice);

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={shown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,64,0,0.08)" />
              <stop offset="100%" stopColor="rgba(255,64,0,0)" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), "MMM d")}
            tick={{ fontSize: 11, fill: "#4a4a4a" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#4a4a4a" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1e1e1e",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(d) => format(parseISO(d), "MMM d, yyyy")}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#ff4000"
            strokeWidth={1.5}
            fill="url(#areaFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
