"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTopbar } from "@/components/layout/topbar-context";

export function DashboardTopbarAction() {
  const { setAction } = useTopbar();
  const router = useRouter();

  useEffect(() => {
    setAction({
      label: "New Email",
      onClick: () => router.push("/compose"),
    });
    return () => setAction(null);
  }, [setAction, router]);

  return null;
}
