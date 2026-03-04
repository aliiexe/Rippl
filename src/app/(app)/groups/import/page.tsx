"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type Status = "idle" | "working" | "done" | "error";

export default function ImportGroupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("This share link is missing or invalid.");
      return;
    }

    let cancelled = false;
    setStatus("working");
    setMessage("Importing group…");

    fetch("/api/groups/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          groupId?: string;
          importedCount?: number;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          if (data.error === "link_expired") {
            throw new Error("This share link has expired.");
          }
          if (data.error === "not_found" || data.error === "source_missing") {
            throw new Error("This share link is invalid or the original group no longer exists.");
          }
          throw new Error("Could not import group. Please try again.");
        }
        const count = data.importedCount ?? 0;
        setStatus("done");
        setMessage(`Imported ${count} member${count === 1 ? "" : "s"} into your new group.`);
        toast("Group imported into your workspace.");
        setTimeout(() => {
          router.push("/groups");
        }, 1500);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err?.message || "Could not import group. Please try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[18px] px-6 py-8 shadow-xl">
        <h1 className="text-[18px] font-semibold text-[#f2f2f2] mb-2">Import Group</h1>
        <p className="text-[13px] text-[#888] mb-4">
          Use this page to import a shared group into your own workspace.
        </p>
        <div className="mt-2 text-[13px] text-[#f2f2f2]">
          {status === "working" && <p>We&apos;re copying this group and its members into your account…</p>}
          {status === "done" && <p>{message}</p>}
          {status === "error" && <p className="text-[#f87171]">{message}</p>}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/groups")}
            className="bg-[#1e1e1e] hover:bg-[#262626] border border-[rgba(255,255,255,0.08)] text-[#f2f2f2] text-[13px] font-medium px-4 py-1.5 rounded-[8px] transition-all duration-150"
          >
            Back to Groups
          </button>
        </div>
      </div>
    </div>
  );
}

