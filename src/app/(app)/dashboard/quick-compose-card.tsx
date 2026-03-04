"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";

type Group = { id: string; name: string; emoji: string; memberCount: number };

export function QuickComposeCard({ groups: initialGroups }: { groups: Group[] }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const toggleGroup = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) {
      toast("Select at least one group");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/compose/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Failed to load recipients");
        setSending(false);
        return;
      }
      const recipients = data.recipients ?? [];
      if (recipients.length === 0) {
        toast("No recipients in selected groups");
        setSending(false);
        return;
      }
      const sendRes = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupIds: Array.from(selectedIds),
          subject: subject || "(No subject)",
          body: "Hi {{name}},\n\n",
        }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        toast(sendData.error ?? "Failed to send");
        setSending(false);
        return;
      }
      toast("Sent");
      setSubject("");
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      toast("Something went wrong");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5 sm:p-6">
      <h3 className="text-[14px] font-semibold text-[#f2f2f2] mb-4">Quick Send</h3>
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider mb-2">Groups</p>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGroup(g.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border cursor-pointer transition-all duration-150 ease-out ${
                  selectedIds.has(g.id)
                    ? "bg-[#ff4000] border-[#ff4000] text-white"
                    : "border-[rgba(255,255,255,0.08)] text-[#888] hover:border-[rgba(255,255,255,0.16)] hover:text-[#f2f2f2]"
                }`}
              >
                {g.emoji} {g.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="sr-only" htmlFor="quick-send-subject">Subject</label>
          <Input
            id="quick-send-subject"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full"
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="w-full bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold py-2.5 rounded-lg transition-colors duration-150 disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
