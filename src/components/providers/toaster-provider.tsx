"use client";

import { Toaster } from "react-hot-toast";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          backgroundColor: "#0B0F1A",
          color: "#E5E7EB",
          borderRadius: "9999px",
          border: "1px solid rgba(148, 163, 184, 0.4)",
          paddingInline: "14px",
          paddingBlock: "10px",
          fontSize: "0.85rem",
        },
        success: {
          iconTheme: {
            primary: "#22C55E",
            secondary: "#020617",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#020617",
          },
        },
      }}
    />
  );
}

