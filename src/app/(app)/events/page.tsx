"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import toast from "react-hot-toast";
import { Sparkles, MapPin } from "lucide-react";
import { useTopbar } from "@/components/layout/topbar-context";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { CustomCheckbox } from "@/components/ui/custom-checkbox";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { triggerRemindersRefresh } from "@/lib/reminders-events";

type Group = { id: string; name: string; emoji?: string };
type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  date?: string;
  start_time?: string;
  end_time?: string | null;
  location: string | null;
  group_ids?: string[];
  groupIds?: string[];
};

const REMINDER_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "No reminder" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
  { value: "2880", label: "2 days before" },
  { value: "10080", label: "1 week before" },
];

export default function EventsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [location, setLocation] = useState("");
  const [reminder, setReminder] = useState("none");
  const [inviteEmail, setInviteEmail] = useState(false);
  const [endError, setEndError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [upcoming, setUpcoming] = useState<EventItem[]>([]);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => (r.ok ? r.json() : { groups: [] }))
      .then((d: { groups: Group[] }) => setGroups(d.groups ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d: { events: EventItem[] }) => setUpcoming(d.events ?? []))
      .catch(() => {});
  }, []);

  const { setAction } = useTopbar();
  useEffect(() => {
    setAction({ label: "Create Event", onClick: () => formRef.current?.requestSubmit() });
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

  const generateDescription = async () => {
    if (!title.trim()) {
      toast("Enter a title first.");
      return;
    }
    const groupName = groups.find((g) => selectedIds.has(g.id))?.name ?? null;
    try {
      const res = await fetch("/api/ai/event-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTitle: title.trim(),
          location: location.trim() || undefined,
          groupName: groupName ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.description) setDescription(data.description);
    } catch {
      toast("Could not generate description.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEndError(false);
    if (!title.trim()) {
      toast("Enter an event title.");
      return;
    }
    if (start && end && end <= start) {
      setEndError(true);
      toast("End must be after start.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          start: start?.toISOString() ?? null,
          end: end?.toISOString() ?? null,
          location: location.trim() || null,
          groupIds: Array.from(selectedIds),
          reminder: reminder === "none" ? null : reminder,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const result = await res.json().catch(() => ({}));
      const addedToCalendar = !!result?.event?.googleEventId;
      toast(addedToCalendar ? "Event created and added to Google Calendar." : "Event created. Connect Google Calendar in Settings to sync to your calendar.");
      setTitle("");
      setDescription("");
      setStart(null);
      setEnd(null);
      setLocation("");
      triggerRemindersRefresh();
      const data = await fetch("/api/events").then((r) => (r.ok ? r.json() : { events: [] }));
      setUpcoming(data.events ?? []);
    } catch {
      toast("Could not create event.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="grid grid-cols-[1fr_300px] gap-6">
      <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-6">
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[14px] font-medium text-[#f2f2f2] mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="text-[15px] font-medium"
            />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#f2f2f2] mb-1">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this event about?"
              className="min-h-[80px]"
            />
            <button
              type="button"
              onClick={generateDescription}
              className="mt-1 inline-flex items-center gap-1 rounded-full bg-[rgba(255,64,0,0.06)] px-2 py-0.5 text-[12px] font-medium text-[#ff4000] hover:bg-[rgba(255,64,0,0.12)] transition-colors"
            >
              <span className="relative flex h-4 w-4 items-center justify-center">
                <Sparkles className="h-3 w-3 text-[#ffe7c2] rippl-ai-shine" strokeWidth={1.6} />
              </span>
              <span>Generate with AI</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[14px] font-medium text-[#f2f2f2] mb-1">Start</label>
              <CustomDatePicker value={start} onChange={setStart} placeholder="Select" showTime />
            </div>
            <div>
              <label className="block text-[14px] font-medium text-[#f2f2f2] mb-1">End</label>
              <CustomDatePicker
                value={end}
                onChange={(v) => { setEnd(v); setEndError(false); }}
                placeholder="Select"
                showTime
              />
              {endError && <p className="text-[12px] text-[#f87171] mt-1">End must be after start</p>}
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#f2f2f2] mb-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#4a4a4a]" strokeWidth={1.5} />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Address or link"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#f2f2f2] mb-2">Groups</label>
            {groups.length === 0 ? (
              <p className="text-[13px] text-[#4a4a4a]">
                <Link href="/groups" className="text-[#ff4000] hover:underline">Create a group</Link> first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
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
                ))}
              </div>
            )}
          </div>
          <div>
            <CustomCheckbox
              checked={inviteEmail}
              onChange={setInviteEmail}
              label="Auto-send invite email to group members"
            />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#f2f2f2] mb-1">Reminder</label>
            <CustomSelect
              value={reminder}
              onChange={setReminder}
              options={REMINDER_OPTIONS}
              placeholder="Select"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-colors duration-150 disabled:opacity-60 w-fit"
          >
            Create Event
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-widest mb-3">Upcoming</h3>
        {upcoming.length === 0 ? (
          <p className="text-[12px] text-[#4a4a4a]">No events yet.</p>
        ) : (
          <ul>
            {upcoming.map((ev) => {
              const gids = ev.group_ids ?? ev.groupIds ?? [];
              const groupName = gids.length ? groups.find((g) => g.id === gids[0])?.name : null;
              const start = ev.start_time ?? ev.date;
              return (
                <li
                  key={ev.id}
                  className="py-4 border-b border-[rgba(255,255,255,0.05)] cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setDetailEvent(ev)}
                >
                  <p className="text-[13px] font-medium text-[#f2f2f2]">{ev.title}</p>
                  <p className="text-[12px] text-[#888] mt-0.5">{start ? formatDate(start) : ""}</p>
                  <p className="text-[12px] text-[#888]">
                    {start && formatTime(start)}
                    {ev.end_time && ` – ${formatTime(ev.end_time)}`}
                    {ev.location && ` · ${ev.location}`}
                  </p>
                  {groupName && <Badge variant="default" className="mt-1">{groupName}</Badge>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          groupName={groups.find((g) => detailEvent.group_ids?.includes(g.id))?.name ?? null}
          onClose={() => setDetailEvent(null)}
        />
      )}
    </div>
  );
}

function EventDetailModal({
  event,
  groupName,
  onClose,
}: {
  event: EventItem;
  groupName: string | null;
  onClose: () => void;
}) {
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const start = event.start_time ?? event.date;

  const modal = (
    <>
      <div
        className="rippl-modal-overlay z-50 bg-black/60 backdrop-blur-sm animate-modal-overlay"
        style={{ position: "fixed", inset: 0 }}
        onClick={onClose}
      />
      <div
        className="rippl-modal-center z-50 p-4 pointer-events-none"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="w-full max-w-[500px] pointer-events-auto bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-6 shadow-xl animate-modal-content">
          <h3 className="text-[16px] font-semibold text-[#f2f2f2]">{event.title}</h3>
          {event.description && <p className="text-[13px] text-[#888] mt-2">{event.description}</p>}
          <div className="mt-4 space-y-1 text-[13px] text-[#888]">
            {start && <p>{formatDate(start)} · {formatTime(start)}{event.end_time && ` – ${formatTime(event.end_time)}`}</p>}
            {event.location && <p>{event.location}</p>}
            {groupName && <Badge variant="default" className="mt-2">{groupName}</Badge>}
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#1e1e1e] hover:bg-[#262626] border border-[rgba(255,255,255,0.08)] text-[#f2f2f2] text-[13px] font-medium px-4 py-1.5 rounded-[8px]"
            >
              Close
            </button>
            <button
              type="button"
              className="bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px]"
            >
              Send Invite Again
            </button>
          </div>
        </div>
      </div>
    </>
  );
  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
