"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTopbar } from "@/components/layout/topbar-context";
import { CustomToggle } from "@/components/ui/custom-toggle";
import { CustomSelect } from "@/components/ui/custom-select";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { triggerRemindersRefresh } from "@/lib/reminders-events";

type Reminder = {
  id: string;
  type: string;
  title: string;
  detail?: string | null;
  recipients: string | number;
  scheduledFor: string | null;
  status: string;
};

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "email", label: "Email" },
  { value: "event", label: "Event" },
];

const POLL_INTERVAL_MS = 20_000;

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "scheduled" | "sent">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [clearSentOpen, setClearSentOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const prevRemindersRef = useRef<Reminder[]>([]);
  const { setAction } = useTopbar();

  const load = () => {
    fetch("/api/reminders")
      .then((r) => (r.ok ? r.json() : { reminders: [] }))
      .then((d: { reminders: Reminder[] }) => {
        const next = d.reminders ?? [];
        const prev = prevRemindersRef.current;
        prevRemindersRef.current = next;
        setReminders(next);
        // Notify when a scheduled item was just sent (e.g. by cron)
        next.forEach((r) => {
          if (r.status !== "sent") return;
          const wasScheduled = prev.find((p) => p.id === r.id)?.status === "scheduled";
          if (wasScheduled) {
            const label = r.type === "email" ? "Scheduled email sent" : "Reminder sent";
            toast.success(`${label}: ${r.title}`);
            triggerRemindersRefresh();
          }
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const filtered = reminders.filter((r) => {
    if (tab === "scheduled" && r.status !== "scheduled") return false;
    if (tab === "sent" && r.status !== "sent") return false;
    if (typeFilter === "email" && r.type !== "email") return false;
    if (typeFilter === "event" && r.type !== "event") return false;
    return true;
  });

  const hasSent = reminders.some((r) => r.status === "sent");

  useEffect(() => {
    if (!hasSent) {
      setAction(null);
      return () => setAction(null);
    }
    setAction({
      label: "Clear Sent",
      onClick: () => setClearSentOpen(true),
    });
    return () => setAction(null);
  }, [hasSent, setAction]);

  const handleClearSent = async () => {
    const res = await fetch("/api/reminders/clear-sent", { method: "POST" });
    if (res.ok) {
      toast("Cleared.");
      load();
    } else toast("Failed to clear.");
    setClearSentOpen(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Deleted.");
      load();
    } else toast("Could not delete.");
    setDeleteId(null);
  };

  const formatScheduled = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

  const reminderToDelete = deleteId ? reminders.find((r) => r.id === deleteId) : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-[#1e1e1e] animate-pulse rounded-[8px] w-64" />
        <div className="h-64 bg-[#1e1e1e] animate-pulse rounded-[10px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CustomToggle
          options={[
            { value: "all", label: "All" },
            { value: "scheduled", label: "Scheduled" },
            { value: "sent", label: "Sent" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
        />
        <CustomSelect value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} placeholder="Type" />
        <span className="ml-auto text-[12px] text-[#888]">
          {filtered.length} reminder{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[13px] text-[#4a4a4a] text-center py-12">
          No reminders yet. Scheduled emails and event reminders will appear here.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="border border-[rgba(255,255,255,0.06)] rounded-[12px] px-4 py-3.5 bg-[#121212] hover:bg-[#161616] transition-colors duration-150"
            >
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-0.5">
                  {r.type === "event" ? "Event" : "Email"}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-[#f2f2f2] truncate">{r.title}</p>
                    <Badge variant={r.status === "sent" ? "success" : "accent"} className="text-[10px] px-2 py-0.5">
                      {r.status}
                    </Badge>
                  </div>
                  {r.detail && (
                    <p className="text-[12px] text-[#888] mt-0.5 line-clamp-2">{r.detail}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-[#888]">
                    <span className="flex items-center gap-1">
                      <span className="text-[#4a4a4a] uppercase tracking-wider">When</span>
                      <span className="font-mono text-[11px] text-[#f2f2f2]">
                        {formatScheduled(r.scheduledFor)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-[#4a4a4a] uppercase tracking-wider">Recipients</span>
                      <span className="text-[#f2f2f2]">
                        {typeof r.recipients === "number"
                          ? `${r.recipients} person${r.recipients === 1 ? "" : "s"}`
                          : String(r.recipients)}
                      </span>
                    </span>
                  </div>
                </div>
                {r.status === "scheduled" && (
                  <button
                    type="button"
                    onClick={() => setDeleteId(r.id)}
                    className="text-[16px] text-[#4a4a4a] hover:text-[#f87171] transition-colors ml-2"
                    aria-label="Delete"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={clearSentOpen}
        onClose={() => setClearSentOpen(false)}
        title="Clear sent reminders?"
        body="This will remove all sent reminders from the list. This action cannot be undone."
        confirmLabel="Clear Sent"
        onConfirm={handleClearSent}
        variant="danger"
      />

      <ConfirmModal
        open={!!reminderToDelete}
        onClose={() => setDeleteId(null)}
        title={reminderToDelete ? `Delete reminder?` : ""}
        body={reminderToDelete ? `This scheduled reminder will be cancelled.` : ""}
        confirmLabel="Delete"
        onConfirm={() => reminderToDelete && handleDelete(reminderToDelete.id)}
        variant="danger"
      />
    </div>
  );
}
