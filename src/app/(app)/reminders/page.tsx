"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTopbar } from "@/components/layout/topbar-context";
import { CustomToggle } from "@/components/ui/custom-toggle";
import { CustomSelect } from "@/components/ui/custom-select";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Reminder = {
  id: string;
  type: string;
  title: string;
  recipients: string | number;
  scheduledFor: string | null;
  status: string;
};

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "email", label: "Email" },
  { value: "event", label: "Event" },
];

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "scheduled" | "sent">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [clearSentOpen, setClearSentOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { setAction } = useTopbar();

  const load = () => {
    fetch("/api/reminders")
      .then((r) => (r.ok ? r.json() : { reminders: [] }))
      .then((d: { reminders: Reminder[] }) => setReminders(d.reminders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
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
    <div>
      <div className="flex items-center gap-3 mb-5">
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
        <span className="ml-auto text-[12px] text-[#888]">{filtered.length} reminders</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[12px] text-[#4a4a4a] text-center py-12">No reminders scheduled.</p>
      ) : (
        <div className="border border-[rgba(255,255,255,0.06)] rounded-[10px] overflow-hidden">
          <div className="grid grid-cols-[80px_2fr_1fr_1fr_90px_40px] items-center px-4 py-2 border-b border-[rgba(255,255,255,0.06)] text-[11px] font-medium text-[#4a4a4a] uppercase tracking-widest">
            <span>Type</span>
            <span>Title</span>
            <span>Recipients</span>
            <span>Scheduled For</span>
            <span>Status</span>
            <span></span>
          </div>
          {filtered.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[80px_2fr_1fr_1fr_90px_40px] items-center px-4 py-3.5 border-b border-[rgba(255,255,255,0.05)] hover:bg-[#161616] transition-all duration-150"
            >
              <Badge variant="default">{r.type === "event" ? "Event" : "Email"}</Badge>
              <span className="text-[13px] font-medium text-[#f2f2f2] truncate">{r.title}</span>
              <span className="text-[12px] text-[#888]">{typeof r.recipients === "number" ? `${r.recipients} people` : String(r.recipients)}</span>
              <span className="text-[12px] text-[#4a4a4a] font-mono">{formatScheduled(r.scheduledFor)}</span>
              <Badge variant={r.status === "sent" ? "success" : "accent"}>{r.status}</Badge>
              <div>
                {r.status === "scheduled" && (
                  <button
                    type="button"
                    onClick={() => setDeleteId(r.id)}
                    className="text-[14px] text-[#4a4a4a] hover:text-[#f87171] transition-colors"
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
