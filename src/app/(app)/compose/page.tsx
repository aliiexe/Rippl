"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { useTopbar } from "@/components/layout/topbar-context";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { CustomCheckbox } from "@/components/ui/custom-checkbox";
import { CustomToggle } from "@/components/ui/custom-toggle";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const COMPOSE_DRAFT_KEY = "rippl-compose-draft";

type ComposeDraft = {
  subject: string;
  body: string;
  selectedIds: string[];
  scheduleOn: boolean;
  scheduledAt: string | null;
};

function loadDraft(): ComposeDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COMPOSE_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as ComposeDraft;
    return d && (d.subject?.trim() || d.body?.trim() || (d.selectedIds?.length ?? 0) > 0) ? d : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: ComposeDraft) {
  if (typeof window === "undefined") return;
  try {
    if (!draft.subject?.trim() && !draft.body?.trim() && (draft.selectedIds?.length ?? 0) === 0) {
      localStorage.removeItem(COMPOSE_DRAFT_KEY);
      return;
    }
    localStorage.setItem(COMPOSE_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(COMPOSE_DRAFT_KEY);
  } catch {
    // ignore
  }
}

type Group = { id: string; name: string; emoji: string; memberCount: number };
type Recipient = { name: string; email: string; groupName: string };

const TEMPLATES: { label: string; subject: string; body: string }[] = [
  { label: "Meeting", subject: "Meeting scheduled", body: "Hi {{name}},\n\nWe have a meeting scheduled. Please confirm your availability.\n\nBest," },
  { label: "Announcement", subject: "Important announcement", body: "Hi {{name}},\n\nI wanted to share an important update with you.\n\nBest," },
  { label: "Reminder", subject: "Reminder", body: "Hi {{name}},\n\nThis is a friendly reminder.\n\nBest," },
  { label: "Workshop", subject: "Workshop invitation", body: "Hi {{name}},\n\nYou're invited to our upcoming workshop. We hope to see you there.\n\nBest," },
];

export default function ComposePage() {
  const searchParams = useSearchParams();
  const preselectedGroup = searchParams.get("group");
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduleOn, setScheduleOn] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number } | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const sendRef = useRef<() => void>(() => {});
  const skipSaveRef = useRef(true);
  const lastDraftRef = useRef<ComposeDraft>({
    subject: "",
    body: "",
    selectedIds: [],
    scheduleOn: false,
    scheduledAt: null,
  });

  // Restore draft on mount and merge URL ?group= into selectedIds so it isn’t overwritten by groups fetch
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setSubject(draft.subject ?? "");
      setBody(draft.body ?? "");
      const ids = [...(draft.selectedIds ?? [])];
      if (preselectedGroup && !ids.includes(preselectedGroup)) ids.push(preselectedGroup);
      setSelectedIds(new Set(ids));
      setScheduleOn(!!draft.scheduleOn);
      setScheduledAt(draft.scheduledAt ? new Date(draft.scheduledAt) : null);
    } else if (preselectedGroup) {
      setSelectedIds((prev) => new Set(prev).add(preselectedGroup));
    }
    const t = setTimeout(() => {
      skipSaveRef.current = false;
    }, 100);
    return () => clearTimeout(t);
  }, [preselectedGroup]);

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => (r.ok ? r.json() : { groups: [] }))
      .then((data: { groups: Group[] }) => {
        const list = (data.groups ?? []).map((g) => ({ ...g, emoji: g.emoji ?? "👥" }));
        setGroups(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedIds.size === 0) {
      setRecipients([]);
      return;
    }
    const ids = Array.from(selectedIds).join(",");
    fetch(`/api/compose/recipients?groupIds=${ids}`)
      .then((r) => (r.ok ? r.json() : { recipients: [], members: [] }))
      .then((d: { recipients?: Recipient[]; members?: Recipient[] }) => {
        const list = d.recipients ?? d.members ?? [];
        setRecipients(list);
      })
      .catch(() => setRecipients([]));
  }, [selectedIds]);

  useEffect(() => {
    const draft: ComposeDraft = {
      subject,
      body,
      selectedIds: Array.from(selectedIds),
      scheduleOn,
      scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
    };
    lastDraftRef.current = draft;
    if (skipSaveRef.current) return;
    saveDraft(draft);
    return () => {
      saveDraft(lastDraftRef.current);
    };
  }, [subject, body, selectedIds, scheduleOn, scheduledAt]);

  // Persist draft on tab/window close (pagehide); in-app navigation is covered by effect cleanup above
  useEffect(() => {
    const flush = () => saveDraft(lastDraftRef.current);
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  const { setAction } = useTopbar();
  useEffect(() => {
    setAction({ label: "Send", onClick: () => sendRef.current() });
    return () => setAction(null);
  }, [setAction]);

  const toggleGroup = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalRecipients = groups.filter((g) => selectedIds.has(g.id)).reduce((s, g) => s + (g.memberCount ?? 0), 0);

  async function handleSend() {
    if (selectedIds.size === 0) {
      toast("Select at least one group.");
      return;
    }
    if (!subject.trim()) {
      toast("Enter a subject.");
      return;
    }
    if (!body.trim()) {
      toast("Enter a message body.");
      return;
    }
    if (scheduleOn && !scheduledAt) {
      toast("Pick a date and time for scheduled send.");
      return;
    }
    setSending(true);
    setSendProgress({ current: 0, total: totalRecipients });
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          groupIds: Array.from(selectedIds),
          scheduleAt: scheduleOn && scheduledAt ? scheduledAt.toISOString() : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setSendProgress(null);
      if (!res.ok) {
        const msg = data.error === "gmail_not_connected"
          ? "Connect Gmail in Settings to send emails."
          : (data.error || "Failed to send.");
        toast(msg);
        return;
      }
      if (data.scheduled) {
        toast("Email scheduled.");
      } else {
        toast(`Sent to ${data.recipientCount ?? totalRecipients} people.`);
      }
      setSubject("");
      setBody("");
      setScheduleOn(false);
      setScheduledAt(null);
      clearDraft();
    } catch {
      setSendProgress(null);
      toast("Failed to send.");
    } finally {
      setSending(false);
    }
  }
  sendRef.current = handleSend;

  const summaryNames = recipients.map((r) => r.name || r.email.split("@")[0]).filter(Boolean);
  const summaryLine =
    summaryNames.length === 0
      ? ""
      : summaryNames.length <= 2
        ? summaryNames.join(", ")
        : `${summaryNames.slice(0, 2).join(", ")} and ${summaryNames.length - 2} others`;

  return (
    <div className="grid grid-cols-[1fr_300px] gap-6 h-full">
      <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[18px] flex flex-col min-h-0">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
          <span className="text-[14px] font-semibold text-[#f2f2f2]">New Email</span>
          <div className="flex items-center gap-1 text-[12px] text-[#4a4a4a]">
            {TEMPLATES.map((t, i) => (
              <span key={t.label}>
                <button
                  type="button"
                  onClick={() => {
                    setSubject(t.subject);
                    setBody(t.body);
                  }}
                  className="hover:text-[#f2f2f2] transition-colors"
                >
                  {t.label}
                </button>
                {i < TEMPLATES.length - 1 && " · "}
              </span>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)] flex flex-wrap gap-2">
          {groups.length === 0 ? (
            <p className="text-[13px] text-[#4a4a4a]">
              <Link href="/groups" className="text-[#ff4000] hover:underline">Create a group</Link> to start.
            </p>
          ) : (
            groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGroup(g.id)}
                className={`px-3 py-1 rounded-full text-[12px] font-medium border cursor-pointer transition-all duration-150 ${
                  selectedIds.has(g.id)
                    ? "bg-[#ff4000] border-[#ff4000] text-white"
                    : "border-[rgba(255,255,255,0.08)] text-[#888] hover:border-[rgba(255,255,255,0.16)] hover:text-[#f2f2f2]"
                }`}
              >
                {g.emoji} {g.name}
              </button>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="bg-transparent border-none text-[15px] font-medium placeholder:text-[#4a4a4a] px-0"
          />
        </div>

        <div className="relative px-5 py-4 flex-1 min-h-[240px]">
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="absolute top-4 right-5 z-10 inline-flex items-center gap-1 text-[12px] font-semibold text-[#ff4000] hover:text-[#ff6633] cursor-pointer px-2 py-1 rounded-[999px] hover:bg-[rgba(255,64,0,0.08)] transition-all shadow-[0_0_0_1px_rgba(255,64,0,0.35)]"
          >
            <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(255,64,0,0.16)]">
              <Sparkles className="h-3 w-3 text-[#ffe7c2] rippl-ai-shine" strokeWidth={1.6} />
            </span>
            <span>AI</span>
          </button>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            className="min-h-[240px] resize-none bg-transparent border-none text-[13px] leading-relaxed placeholder:text-[#4a4a4a] px-0"
          />
          <p className="text-[11px] text-[#4a4a4a] mt-1">{"{{name}}"} → replaced with each recipient&apos;s name</p>
        </div>

        {sending && sendProgress ? (
          <div className="flex items-center gap-3 px-5 py-3 border-t border-[rgba(255,255,255,0.06)]">
            <span className="text-[13px] text-[#888]">Sending {sendProgress.current} of {sendProgress.total}...</span>
            <div className="flex-1 h-0.5 bg-[#1e1e1e] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ff4000] transition-all duration-300"
                style={{ width: `${totalRecipients ? (sendProgress.current / sendProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScheduleOn((o) => !o)}
                className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors flex-shrink-0 ${
                  scheduleOn ? "bg-[#ff4000]" : "bg-[#262626]"
                }`}
                aria-label="Send later"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-150 ${
                    scheduleOn ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-[12px] text-[#888]">Send later</span>
              {scheduleOn && (
                <CustomDatePicker
                  value={scheduledAt}
                  onChange={setScheduledAt}
                  placeholder="Pick date & time"
                  showTime
                  placement="top"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-[13px] font-medium text-[#888] hover:text-[#f2f2f2] transition-colors"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-colors duration-150 disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-5 flex flex-col min-h-0">
        <h3 className="text-[13px] font-semibold text-[#f2f2f2]">
          Recipients <span className="text-[12px] font-normal text-[#888]">({recipients.length})</span>
        </h3>
        {recipients.length > 0 && (
          <p className="text-[12px] text-[#888] leading-relaxed mt-1">{summaryLine}</p>
        )}
        <div className="border-b border-[rgba(255,255,255,0.06)] mb-3 mt-2" />
        <div className="max-h-[400px] overflow-y-auto space-y-0 flex-1 min-h-0">
          {selectedIds.size === 0 ? (
            <p className="text-[12px] text-[#4a4a4a] text-center py-8">Select a group to see recipients</p>
          ) : recipients.length === 0 ? (
            <p className="text-[12px] text-[#4a4a4a] text-center py-8">No recipients</p>
          ) : (
            recipients.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-[rgba(255,255,255,0.05)]"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#f2f2f2] truncate">{r.name || "—"}</p>
                  <p className="text-[11px] text-[#4a4a4a] font-mono truncate">{r.email}</p>
                </div>
                {r.groupName && <Badge variant="default" className="flex-shrink-0 ml-2">{r.groupName}</Badge>}
              </div>
            ))
          )}
        </div>
      </div>

      {aiOpen && (
        <AISheet
          onClose={() => setAiOpen(false)}
          onUse={(subjectLine, bodyText) => {
            if (subjectLine) setSubject(subjectLine);
            setBody(bodyText);
            setAiOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AISheet({
  onClose,
  onUse,
}: {
  onClose: () => void;
  onUse: (subject: string, body: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<"professional" | "friendly" | "casual">("professional");
  const [generateSubject, setGenerateSubject] = useState(false);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<{ subject?: string; body: string } | null>(null);

  const generate = async () => {
    if (!prompt.trim()) {
      toast("Describe what you want to say.");
      return;
    }
    setLoading(true);
    setOutput(null);
    try {
      const res = await fetch("/api/ai/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          tone,
          generateSubject,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Could not generate.");
        return;
      }
      if (data.subject != null) {
        setOutput({ subject: data.subject, body: data.body ?? "" });
      } else {
        setOutput({ body: data.draft ?? "" });
      }
    } catch {
      toast("Could not generate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-modal-overlay" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-[#161616] border-l border-[rgba(255,255,255,0.06)] z-50 flex flex-col p-6 overflow-y-auto animate-modal-sheet">
        <h2 className="text-[16px] font-semibold text-[#f2f2f2]">Write with AI</h2>
        <p className="text-[12px] text-[#888] mt-0.5">Describe what you want, AI will handle the rest.</p>

        <label className="block text-[13px] font-medium text-[#f2f2f2] mt-4 mb-1">What do you want to say?</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to say..."
          className="min-h-[120px] mt-0"
        />

        <div className="mt-4">
          <CustomCheckbox
            checked={generateSubject}
            onChange={setGenerateSubject}
            label="Also generate subject line"
          />
        </div>

        <div className="mt-4">
          <span className="block text-[13px] font-medium text-[#f2f2f2] mb-2">Tone</span>
          <CustomToggle
            options={[
              { value: "professional", label: "Professional" },
              { value: "friendly", label: "Friendly" },
              { value: "casual", label: "Casual" },
            ]}
            value={tone}
            onChange={(v) => setTone(v as typeof tone)}
          />
        </div>

        <p className="text-[11px] text-[#4a4a4a] mt-2">Model: meta-llama/llama-3.2-3b-instruct:free</p>

        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="mt-4 w-full bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold py-2 rounded-[8px] transition-colors duration-150 disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate"}
        </button>

        {output && (
          <div className="mt-6 p-4 bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] rounded-[12px]">
            {output.subject && (
              <>
                <p className="text-[10px] uppercase text-[#4a4a4a] mb-1">Subject</p>
                <p className="text-[13px] text-[#f2f2f2] mb-3">{output.subject}</p>
              </>
            )}
            {output.subject && output.body && <div className="border-t border-[rgba(255,255,255,0.06)] my-3" />}
            <p className="text-[13px] text-[#f2f2f2] leading-relaxed whitespace-pre-wrap">{output.body}</p>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => onUse(output.subject ?? "", output.body)}
                className="bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px]"
              >
                Use this
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className="bg-[#1e1e1e] hover:bg-[#262626] border border-[rgba(255,255,255,0.08)] text-[#f2f2f2] text-[13px] font-medium px-4 py-1.5 rounded-[8px]"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
