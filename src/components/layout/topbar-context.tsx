"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type TopbarAction = {
  label: string;
  onClick: () => void;
} | null;

const TopbarContext = createContext<{
  action: TopbarAction;
  setAction: (action: TopbarAction) => void;
}>({ action: null, setAction: () => {} });

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<TopbarAction>(null);
  return (
    <TopbarContext.Provider value={{ action, setAction }}>
      {children}
    </TopbarContext.Provider>
  );
}

export function useTopbar() {
  return useContext(TopbarContext);
}
