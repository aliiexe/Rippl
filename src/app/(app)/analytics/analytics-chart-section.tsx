"use client";

import { useState } from "react";
import { CustomToggle } from "@/components/ui/custom-toggle";
import { AnalyticsChart } from "./analytics-chart";
import type { EmailsOverTimePoint } from "@/lib/analytics";

export function AnalyticsChartSection({ emailsOverTime }: { emailsOverTime: EmailsOverTimePoint[] }) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-[#f2f2f2]">Emails Sent</h3>
        <CustomToggle
          options={[
            { value: "7d", label: "7d" },
            { value: "30d", label: "30d" },
            { value: "90d", label: "90d" },
          ]}
          value={range}
          onChange={(v) => setRange(v as "7d" | "30d" | "90d")}
        />
      </div>
      <AnalyticsChart data={emailsOverTime} range={range} />
    </>
  );
}
