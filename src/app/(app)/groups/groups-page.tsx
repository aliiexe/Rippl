"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { GroupsTopbarAction } from "./groups-topbar";
import { ViewGroupModal } from "./view-group-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SearchInput } from "@/components/ui/search-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type Group = {
  id: string;
  emoji: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt?: string;
};

type MemberRow = { id?: string; name: string; email: string };

function formatCreated(iso: string | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const memberSizeOptions: { value: string; label: string }[] = [
  { value: "all", label: "All sizes" },
  { value: "1-5", label: "1–5" },
  { value: "6-20", label: "6–20" },
  { value: "20+", label: "20+" },
];

const sortOptions: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "az", label: "A–Z" },
  { value: "members", label: "Most members" },
];

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [memberSize, setMemberSize] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [viewGroupId, setViewGroupId] = useState<string | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { groups: (Group & { createdAt?: string })[] };
      setGroups(data.groups ?? []);
    } catch {
      toast("Could not load groups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = groups.filter((g) => {
    const q = search.trim().toLowerCase();
    if (q && !g.name.toLowerCase().includes(q) && !(g.description ?? "").toLowerCase().includes(q))
      return false;
    if (memberSize === "1-5" && (g.memberCount < 1 || g.memberCount > 5)) return false;
    if (memberSize === "6-20" && (g.memberCount < 6 || g.memberCount > 20)) return false;
    if (memberSize === "20+" && g.memberCount < 21) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "newest")
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    if (sort === "oldest")
      return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
    if (sort === "az") return a.name.localeCompare(b.name);
    if (sort === "members") return (b.memberCount ?? 0) - (a.memberCount ?? 0);
    return 0;
  });

  const handleDeleteConfirm = async () => {
    if (!deleteGroup) return;
    try {
      const res = await fetch(`/api/groups/${deleteGroup.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setGroups((prev) => prev.filter((g) => g.id !== deleteGroup.id));
      toast("Group deleted.");
    } catch {
      toast("Could not delete group.");
    }
    setDeleteGroup(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-[#1e1e1e] animate-pulse rounded-[8px] w-[240px]" />
        <div className="grid grid-cols-[2fr_1fr_1fr_120px] gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-[#1e1e1e] animate-pulse rounded-[10px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <GroupsTopbarAction onNewGroup={() => { setEditingGroup(null); setCreateModalOpen(true); }} />

      <div className="flex items-center gap-3 mb-5">
        <SearchInput
          placeholder="Search groups..."
          value={search}
          onChange={setSearch}
          className="w-[240px]"
        />
        <CustomSelect
          value={memberSize}
          onChange={(v) => setMemberSize(v)}
          options={[...memberSizeOptions]}
          placeholder="Member count"
        />
        <CustomSelect
          value={sort}
          onChange={(v) => setSort(v)}
          options={[...sortOptions]}
          placeholder="Sort"
        />
        <span className="ml-auto text-[12px] text-[#888]">{sorted.length} groups</span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[13px] text-[#4a4a4a] text-center py-12">No groups found.</p>
      ) : (
        <div className="border border-[rgba(255,255,255,0.06)] rounded-[10px] overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_120px] items-center px-4 py-2 border-b border-[rgba(255,255,255,0.06)] text-[11px] font-medium text-[#4a4a4a] uppercase tracking-widest">
            <span>Name</span>
            <span>Members</span>
            <span>Created</span>
            <span>Actions</span>
          </div>
          {sorted.map((group) => (
            <div
              key={group.id}
              className="grid grid-cols-[2fr_1fr_1fr_120px] items-center px-4 py-3.5 border-b border-[rgba(255,255,255,0.05)] hover:bg-[#161616] transition-all duration-150 cursor-pointer group"
              onClick={() => setViewGroupId(group.id)}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-[18px]">{group.emoji?.trim() || "👥"}</span>
                  <span className="text-[13px] font-medium text-[#f2f2f2]">{group.name}</span>
                </div>
                {group.description && (
                  <p className="text-[11px] text-[#4a4a4a] mt-0.5 truncate">{group.description}</p>
                )}
              </div>
              <span className="text-[13px] text-[#888]">{group.memberCount} members</span>
              <span className="text-[12px] text-[#4a4a4a] font-mono">{formatCreated(group.createdAt)}</span>
              <div
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="text-[12px] text-[#888] hover:text-[#f2f2f2] transition-colors"
                  onClick={() => setViewGroupId(group.id)}
                >
                  View
                </button>
                <button
                  type="button"
                  className="text-[12px] text-[#888] hover:text-[#f2f2f2] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingGroup(group);
                    setCreateModalOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-[12px] text-[#888] hover:text-[#f87171] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteGroup(group);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ViewGroupModal
        groupId={viewGroupId}
        onClose={() => setViewGroupId(null)}
        onEdit={() => {
          if (viewGroupId) {
            const g = groups.find((x) => x.id === viewGroupId);
            if (g) {
              setViewGroupId(null);
              setEditingGroup(g);
              setCreateModalOpen(true);
            }
          }
        }}
      />

      {createModalOpen && (
        <GroupFormModal
          group={editingGroup}
          onClose={() => {
            setCreateModalOpen(false);
            setEditingGroup(null);
          }}
          onSave={() => {
            setCreateModalOpen(false);
            setEditingGroup(null);
            load();
          }}
        />
      )}

      <ConfirmModal
        open={!!deleteGroup}
        onClose={() => setDeleteGroup(null)}
        title={deleteGroup ? `Delete "${deleteGroup.name}"?` : ""}
        body={
          deleteGroup
            ? `This will permanently delete the group and remove all ${deleteGroup.memberCount} members. Emails already sent will not be affected.`
            : ""
        }
        confirmLabel="Delete Group"
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </div>
  );
}

function GroupFormModal({
  group,
  onClose,
  onSave,
}: {
  group: Group | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [emoji, setEmoji] = useState(group?.emoji ?? "");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [initialMemberIds, setInitialMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!group);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [memberErrors, setMemberErrors] = useState<number[]>([]);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (group) {
      fetch(`/api/groups/${group.id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { group: { name: string; description: string | null; emoji: string }; members: { id: string; name: string; email: string }[] } | null) => {
          if (data) {
            setName(data.group.name);
            setDescription(data.group.description ?? "");
            setEmoji(data.group.emoji ?? "");
            const mems = data.members.map((m) => ({ id: m.id, name: m.name ?? "", email: m.email }));
            setMembers(mems);
            setInitialMemberIds(mems.map((m) => m.id).filter(Boolean) as string[]);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [group?.id]);

  const addMember = () => setMembers((prev) => [...prev, { name: "", email: "" }]);
  const removeMember = (i: number) => setMembers((prev) => prev.filter((_, idx) => idx !== i));

  const parseCSV = (text: string): MemberRow[] => {
    const rows: MemberRow[] = [];
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length < 2) continue;
      const a = parts[0];
      const b = parts[1];
      const isHeader = i === 0 && (a.toLowerCase() === "name" || a.toLowerCase() === "email" || b.toLowerCase() === "name" || b.toLowerCase() === "email");
      if (isHeader) continue;
      const hasAt = (s: string) => /@/.test(s);
      if (hasAt(a)) rows.push({ name: b || "", email: a });
      else rows.push({ name: a || "", email: b });
    }
    return rows;
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCSV(text).filter((m) => m.email);
      if (parsed.length) setMembers((prev) => [...prev, ...parsed]);
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const updateMember = (i: number, field: "name" | "email", value: string) => {
    setMembers((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNameError(false);
    setMemberErrors([]);
    if (!name.trim()) {
      setNameError(true);
      toast("Name is required.");
      return;
    }
    const invalidRows: number[] = [];
    members.forEach((m, i) => {
      if (!m.email.trim()) invalidRows.push(i);
    });
    if (invalidRows.length > 0) {
      setMemberErrors(invalidRows);
      toast(`${invalidRows.length} row(s) have missing email.`);
      return;
    }
    setSubmitting(true);
    try {
      if (group) {
        await fetch(`/api/groups/${group.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), description: description.trim() || null, emoji: emoji.trim() || "👥" }),
        });
        for (const id of initialMemberIds) {
          await fetch(`/api/members/${id}`, { method: "DELETE" });
        }
        for (const m of members) {
          if (!m.email.trim()) continue;
          await fetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId: group.id, name: m.name.trim() || null, email: m.email.trim() }),
          });
        }
        toast("Group updated.");
      } else {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), description: description.trim() || null, emoji: emoji.trim() || "👥" }),
        });
        if (!res.ok) throw new Error("Create failed");
        const { group: newGroup } = (await res.json()) as { group: { id: string } };
        for (const m of members) {
          if (!m.email.trim()) continue;
          await fetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId: newGroup.id, name: m.name.trim() || null, email: m.email.trim() }),
          });
        }
        toast("Group created.");
      }
      onSave();
    } catch {
      toast(group ? "Could not update group." : "Could not create group.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-modal-overlay" onClick={onClose} />
        <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-[560px] -translate-x-1/2 -translate-y-1/2 bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-6 animate-modal-content">
          <div className="h-8 bg-[#1e1e1e] animate-pulse rounded-[8px] w-1/2" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-modal-overlay" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-[560px] -translate-x-1/2 -translate-y-1/2 bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-6 shadow-xl max-h-[90vh] overflow-y-auto animate-modal-content">
        <h3 className="text-[16px] font-semibold text-[#f2f2f2]">{group ? "Edit Group" : "New Group"}</h3>
        <p className="text-[13px] text-[#888] mt-0.5">{group ? "Update group details and members." : "Create a group and add members."}</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="block text-[14px] font-medium text-[#f2f2f2] mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
              className={nameError ? "border-[#f87171]" : ""}
            />
            {nameError && <p className="text-[12px] text-[#f87171] mt-1">Required</p>}
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#f2f2f2] mb-1">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#f2f2f2] mb-1">Emoji</label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
              placeholder="✦"
              className="w-[72px]"
            />
          </div>
          <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#f2f2f2]">Members</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => csvInputRef.current?.click()} className="text-[12px] text-[#4a4a4a] hover:text-[#f2f2f2]">
                  Import CSV
                </button>
                <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSVUpload} />
                <button type="button" onClick={addMember} className="text-[13px] font-medium text-[#ff4000] hover:underline">
                  + Add
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex gap-2 items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
                  <Input
                    value={m.name}
                    onChange={(e) => updateMember(i, "name", e.target.value)}
                    placeholder="Name"
                    className="flex-1"
                  />
                  <Input
                    value={m.email}
                    onChange={(e) => updateMember(i, "email", e.target.value)}
                    placeholder="Email"
                    className={`flex-[2] ${memberErrors.includes(i) ? "border-[#f87171]" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeMember(i)}
                    className="text-[14px] text-[#4a4a4a] hover:text-[#f87171] p-1 transition-colors"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <button type="button" onClick={onClose} className="bg-[#1e1e1e] hover:bg-[#262626] border border-[rgba(255,255,255,0.08)] text-[#f2f2f2] text-[13px] font-medium px-4 py-1.5 rounded-[8px] transition-all duration-150">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-colors duration-150 disabled:opacity-50">
              {submitting ? "Saving…" : "Save Group"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
