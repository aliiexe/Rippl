"use client";

import { useMemo } from "react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

export function DashboardGreeting({ firstName }: { firstName: string }) {
  const greeting = useMemo(() => getGreeting(), []);
  const name = firstName.trim() || "there";
  return (
    <>
      {greeting}, {name}.
    </>
  );
}
