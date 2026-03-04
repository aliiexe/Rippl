"use client";

import { useState, useEffect } from "react";

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

  const filtered = search.trim()
    ? members.filter(
        (m) =>
          (m.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  if (!groupId) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-modal-overlay" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-[640px] -translate-x-1/2 -translate-y-1/2 bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-6 shadow-xl max-h-[90vh] overflow-y-auto animate-modal-content">
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
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
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
    </>
  );
}
