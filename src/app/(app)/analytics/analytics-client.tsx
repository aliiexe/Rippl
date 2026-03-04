"use client";

import { useState } from "react";
import { CustomToggle } from "@/components/ui/custom-toggle";
import { AnalyticsChart } from "./analytics-chart";
import type { EmailsOverTimePoint } from "@/lib/analytics";

export function AnalyticsClient({ emailsOverTime }: { emailsOverTime: EmailsOverTimePoint[] }) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  return (
    <CustomToggle
      options={[
        { value: "7d", label: "7d" },
        { value: "30d", label: "30d" },
        { value: "90d", label: "90d" },
      ]}
      value={range}
      onChange={(v) => setRange(v as "7d" | "30d" | "90d")}
    />
  );
}
