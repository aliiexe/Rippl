import { createServerSupabaseClient } from "./supabase";
import { format, subDays, startOfDay } from "date-fns";

export type AnalyticsStats = {
  totalEmailsSent: number;
  totalRecipientsReached: number;
  eventsCreated: number;
  activeReminders: number;
};

export type EmailsOverTimePoint = { date: string; count: number };

export type GroupPerformance = {
  groupName: string;
  groupId: string;
  emailsSent: number;
  membersReached: number;
  lastSent: string | null;
};

export type TopRecipient = {
  name: string | null;
  email: string;
  timesReached: number;
};

export type RecentSend = {
  id: string;
  subject: string | null;
  groupIds: string[];
  recipientCount: number;
  sentAt: string;
  status: string;
};

export async function getAnalyticsData(userId: string): Promise<{
  stats: AnalyticsStats;
  emailsOverTime: EmailsOverTimePoint[];
  groupsPerformance: GroupPerformance[];
  topRecipients: TopRecipient[];
  recentSends: RecentSend[];
}> {
  const supabase = createServerSupabaseClient();

  const [emailsRes, eventsRes, remindersRes, sentEmailsList, groupsRes] = await Promise.all([
    supabase.from("sent_emails").select("id, recipient_count, sent_at, group_ids").eq("user_id", userId),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("reminders").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "scheduled"),
    supabase.from("sent_emails").select("id, subject, recipient_count, group_ids, sent_at, status").eq("user_id", userId).order("sent_at", { ascending: false }).limit(50),
    supabase.from("groups").select("id, name").eq("user_id", userId),
  ]);

  const emails = (emailsRes.data ?? []) as { id: string; recipient_count: number | null; sent_at: string; group_ids: string[] | null }[];
  const totalEmailsSent = emails.length;
  const totalRecipientsReached = emails.reduce((s, e) => s + (e.recipient_count ?? 0), 0);
  const eventsCreated = eventsRes.count ?? 0;
  const activeReminders = remindersRes.count ?? 0;

  const stats: AnalyticsStats = {
    totalEmailsSent,
    totalRecipientsReached,
    eventsCreated,
    activeReminders,
  };

  const now = new Date();
  const range90 = Array.from({ length: 90 }, (_, i) => {
    const d = subDays(now, 89 - i);
    return format(startOfDay(d), "yyyy-MM-dd");
  });
  const countByDate: Record<string, number> = {};
  range90.forEach((d) => (countByDate[d] = 0));
  emails.forEach((e) => {
    const d = format(startOfDay(new Date(e.sent_at)), "yyyy-MM-dd");
    if (countByDate[d] !== undefined) countByDate[d]++;
  });
  const emailsOverTime: EmailsOverTimePoint[] = range90.map((date) => ({ date, count: countByDate[date] ?? 0 }));

  const groupIds = (groupsRes.data ?? []) as { id: string; name: string }[];
  const groupMap = Object.fromEntries(groupIds.map((g) => [g.id, g.name]));
  const groupEmails: Record<string, { sent: number; recipients: number; lastSent: string | null }> = {};
  groupIds.forEach((g) => (groupEmails[g.id] = { sent: 0, recipients: 0, lastSent: null }));
  emails.forEach((e) => {
    (e.group_ids ?? []).forEach((gid) => {
      if (groupEmails[gid]) {
        groupEmails[gid].sent++;
        groupEmails[gid].recipients += e.recipient_count ?? 0;
        if (!groupEmails[gid].lastSent || e.sent_at > groupEmails[gid].lastSent!) {
          groupEmails[gid].lastSent = e.sent_at;
        }
      }
    });
  });
  const groupsPerformance: GroupPerformance[] = groupIds.map((g) => ({
    groupName: g.name,
    groupId: g.id,
    emailsSent: groupEmails[g.id]?.sent ?? 0,
    membersReached: groupEmails[g.id]?.recipients ?? 0,
    lastSent: groupEmails[g.id]?.lastSent ?? null,
  }));

  const allGroupIds = groupIds.map((g) => g.id);
  const { data: allMembers } = await supabase
    .from("members")
    .select("email, name, group_id")
    .in("group_id", allGroupIds);
  const membersByEmail: Record<string, { name: string | null; groupIds: Set<string> }> = {};
  (allMembers ?? []).forEach((m: { email: string; name: string | null; group_id: string }) => {
    if (!membersByEmail[m.email]) membersByEmail[m.email] = { name: m.name, groupIds: new Set() };
    membersByEmail[m.email].groupIds.add(m.group_id);
  });
  const recipientCount: Record<string, number> = {};
  emails.forEach((e) => {
    const gids = new Set(e.group_ids ?? []);
    Object.entries(membersByEmail).forEach(([email, { groupIds: memGids }]) => {
      if ([...memGids].some((gid) => gids.has(gid))) {
        recipientCount[email] = (recipientCount[email] ?? 0) + 1;
      }
    });
  });
  const topRecipients: TopRecipient[] = Object.entries(recipientCount)
    .map(([email, timesReached]) => ({
      email,
      name: membersByEmail[email]?.name ?? null,
      timesReached,
    }))
    .sort((a, b) => b.timesReached - a.timesReached)
    .slice(0, 10);

  const recentSends: RecentSend[] = (sentEmailsList.data ?? []).map((r: any) => ({
    id: r.id,
    subject: r.subject,
    groupIds: r.group_ids ?? [],
    recipientCount: r.recipient_count ?? 0,
    sentAt: r.sent_at,
    status: r.status ?? "sent",
  }));

  return { stats, emailsOverTime, groupsPerformance, topRecipients, recentSends };
}
