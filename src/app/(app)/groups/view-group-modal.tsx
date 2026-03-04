"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

type ViewGroupModalProps = {
  groupId: string | null;
  onClose: () => void;
  onEdit: () => void;
};

type GroupDetail = {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  createdAt: string;
  memberCount: number;
  emailsSent?: number;
  lastSent?: string | null;
};

type Member = { id: string; name: string | null; email: string; createdAt?: string };

export function ViewGroupModal({ groupId, onClose, onEdit }: ViewGroupModalProps) {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!!groupId);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    fetch(`/api/groups/${groupId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { group: GroupDetail; members: Member[] } | null) => {
        if (data) {
          setGroup({
            ...data.group,
            emoji: data.group.emoji ?? "👥",
            memberCount: data.members.length,
          });
          setMembers(data.members ?? []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [groupId]);

  const handleShareLink = async () => {
    if (!groupId) return;
    try {
      setShareLoading(true);
      const res = await fetch(`/api/groups/${groupId}/share`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; expiresAt?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not create share link.");
      }
      const url = String(data.url);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast("Share link copied to clipboard.");
      } else {
        window.prompt("Share this link:", url);
      }
    } catch {
      toast("Could not create share link.");
    } finally {
      setShareLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!group || members.length === 0) {
      toast("No members to export.");
      return;
    }
    const header = "Name,Email";
    const rows = members.map((m) => {
      const name = (m.name ?? "").replace(/\"/g, '\"\"');
      const email = m.email.replace(/\"/g, '\"\"');
      return `\"${name}\",\"${email}\"`;
    });
    const blob = new Blob([`${header}\n${rows.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${group.name || "group"}-members.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("CSV downloaded.");
  };

  const filtered = search.trim()
    ? members.filter(
        (m) =>
          (m.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  if (!groupId) return null;

  const modal = (
    <>
      <div
        className="rippl-modal-overlay z-50 bg-black/60 backdrop-blur-sm animate-modal-overlay"
        style={{ position: "fixed", inset: 0 }}
        onClick={onClose}
        aria-hidden="true"
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
        <div className="w-full max-w-[640px] max-h-[90vh] overflow-y-auto pointer-events-auto bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-6 shadow-xl animate-modal-content z-50">
        {loading ? (
          <div className="h-32 bg-[#1e1e1e] animate-pulse rounded-[10px]" />
        ) : group ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{group.emoji}</span>
                  <h3 className="text-[18px] font-semibold text-[#f2f2f2]">{group.name}</h3>
                </div>
                {group.description && (
                  <p className="text-[13px] text-[#888] mt-1">{group.description}</p>
                )}
              </div>
              <span className="text-[12px] text-[#4a4a4a]">
                {new Date(group.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] rounded-[8px] px-3 py-1.5 text-[12px] text-[#f2f2f2]">
                [{group.memberCount}] Members
              </span>
            </div>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[8px] pl-8 pr-3 py-2 text-[13px] text-[#f2f2f2] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#ff4000] mb-3"
              />
              <div className="border border-[rgba(255,255,255,0.06)] rounded-[8px] overflow-hidden">
                {filtered.length === 0 ? (
                  <p className="text-[13px] text-[#4a4a4a] py-4 text-center">No members</p>
                ) : (
                  filtered.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between py-2.5 px-3 border-b border-[rgba(255,255,255,0.05)] last:border-0"
                    >
                      <span className="text-[13px] font-medium text-[#f2f2f2]">{m.name || "—"}</span>
                      <span className="text-[12px] text-[#888] font-mono">{m.email}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="bg-[#1e1e1e] hover:bg-[#262626] border border-[rgba(255,255,255,0.08)] text-[#f2f2f2] text-[12px] font-medium px-3 py-1.5 rounded-[8px] transition-all duration-150"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={handleShareLink}
                  disabled={shareLoading}
                  className="bg-[#1e1e1e] hover:bg-[#262626] border border-[rgba(255,255,255,0.08)] text-[#f2f2f2] text-[12px] font-medium px-3 py-1.5 rounded-[8px] transition-all duration-150 disabled:opacity-50"
                >
                  {shareLoading ? "Creating link…" : "Copy share link"}
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="bg-[#1e1e1e] hover:bg-[#262626] border border-[rgba(255,255,255,0.08)] text-[#f2f2f2] text-[13px] font-medium px-4 py-1.5 rounded-[8px] transition-all duration-150"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onEdit(); }}
                className="bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-colors duration-150"
              >
                Edit Group
              </button>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[#888]">Group not found.</p>
        )}
        </div>
      </div>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
