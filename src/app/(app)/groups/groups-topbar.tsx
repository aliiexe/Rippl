"use client";

import { useEffect } from "react";
import { useTopbar } from "@/components/layout/topbar-context";

export function GroupsTopbarAction({ onNewGroup }: { onNewGroup: () => void }) {
  const { setAction } = useTopbar();
  useEffect(() => {
    setAction({ label: "New Group", onClick: onNewGroup });
    return () => setAction(null);
  }, [setAction, onNewGroup]);
  return null;
}
