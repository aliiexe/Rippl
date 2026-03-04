"use client";

import { useEffect } from "react";
import { useTopbar } from "@/components/layout/topbar-context";

export function AnalyticsTopbarAction() {
  const { setAction } = useTopbar();

  useEffect(() => {
    setAction({
      label: "Export",
      onClick: () => {
        fetch("/api/analytics/export")
          .then((r) => r.blob())
          .then((blob) => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `rippl-emails-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
          })
          .catch(() => {});
      },
    });
    return () => setAction(null);
  }, [setAction]);

  return null;
}
