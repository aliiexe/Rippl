import { createServerSupabaseClient } from "./supabase";

export type DashboardStats = {
  groups: number;
  members: number;
  emailsSent: number;
  scheduled: number;
};

export type ActivityType = "email_sent" | "event_created" | "reminder_sent";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  text: string;
  at: string;
};

function formatAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

export type DashboardGroup = { id: string; name: string; emoji: string; memberCount: number };

export async function getDashboardData(userId: string): Promise<{
  stats: DashboardStats;
  activity: ActivityItem[];
  groups: DashboardGroup[];
}> {
  const supabase = createServerSupabaseClient();

  const [groupsRes, groupsListRes, membersRes, sentRes, scheduledRes, sentEmails, events] = await Promise.all([
    supabase.from("groups").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("groups").select("id, name, emoji, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("members").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("sent_emails").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "scheduled"),
    supabase
      .from("sent_emails")
      .select("id, subject, recipient_count, sent_at")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false })
      .limit(5),
    supabase
      .from("events")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats: DashboardStats = {
    groups: groupsRes.count ?? 0,
    members: membersRes.count ?? 0,
    emailsSent: sentRes.count ?? 0,
    scheduled: scheduledRes.count ?? 0,
  };

  const combined: { item: ActivityItem; at: string }[] = [
    ...(sentEmails.data ?? []).map((r: { id: string; subject: string | null; recipient_count: number | null; sent_at: string }) => ({
      item: {
        id: `sent-${r.id}`,
        type: "email_sent" as const,
        text: `Sent "${r.subject || "(no subject)"}" to ${r.recipient_count ?? 0} people`,
        at: formatAt(r.sent_at),
      },
      at: r.sent_at,
    })),
    ...(events.data ?? []).map((e: { id: string; title: string; created_at: string }) => ({
      item: {
        id: `event-${e.id}`,
        type: "event_created" as const,
        text: `Created event "${e.title}"`,
        at: formatAt(e.created_at),
      },
      at: e.created_at,
    })),
  ];
  combined.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const activity = combined.slice(0, 8).map((x) => x.item);

  const groupIds = (groupsListRes.data ?? []).map((g: { id: string }) => g.id);
  let memberCountByGroup: Record<string, number> = {};
  if (groupIds.length > 0) {
    const { data: memberRows } = await supabase
      .from("members")
      .select("group_id")
      .in("group_id", groupIds);
    if (memberRows) {
      for (const row of memberRows as { group_id: string }[]) {
        memberCountByGroup[row.group_id] = (memberCountByGroup[row.group_id] ?? 0) + 1;
      }
    }
  }
  const groups = (groupsListRes.data ?? []).map((g: { id: string; name: string; emoji: string | null; created_at: string }) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji ?? "👥",
    memberCount: memberCountByGroup[g.id] ?? 0,
  }));

  return { stats, activity, groups };
}
