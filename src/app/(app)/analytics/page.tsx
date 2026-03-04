import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAnalyticsData } from "@/lib/analytics";
import { AnalyticsTopbarAction } from "./analytics-topbar";
import { AnalyticsChartSection } from "./analytics-chart-section";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { stats, emailsOverTime, groupsPerformance, topRecipients, recentSends } = await getAnalyticsData(userId);

  return (
    <>
      <AnalyticsTopbarAction />

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5">
            <p className="text-[28px] font-bold text-[#f2f2f2]">{stats.totalEmailsSent}</p>
            <p className="text-[12px] text-[#888] mt-1">Total Emails Sent</p>
          </div>
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5">
            <p className="text-[28px] font-bold text-[#f2f2f2]">{stats.totalRecipientsReached}</p>
            <p className="text-[12px] text-[#888] mt-1">Total Recipients Reached</p>
          </div>
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5">
            <p className="text-[28px] font-bold text-[#f2f2f2]">{stats.eventsCreated}</p>
            <p className="text-[12px] text-[#888] mt-1">Events Created</p>
          </div>
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5">
            <p className="text-[28px] font-bold text-[#f2f2f2]">{stats.activeReminders}</p>
            <p className="text-[12px] text-[#888] mt-1">Active Reminders</p>
          </div>
        </div>

        <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6">
          <AnalyticsChartSection emailsOverTime={emailsOverTime} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5 overflow-hidden">
            <h3 className="text-[14px] font-semibold text-[#f2f2f2] mb-3">Groups Performance</h3>
            <div className="border-b border-[rgba(255,255,255,0.06)] px-2 py-2 grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 text-[11px] font-medium text-[#4a4a4a] uppercase tracking-widest">
              <span>Name</span>
              <span>Emails</span>
              <span>Reached</span>
              <span>Last sent</span>
            </div>
            {groupsPerformance.length === 0 ? (
              <p className="text-[13px] text-[#4a4a4a] py-4">No data yet.</p>
            ) : (
              groupsPerformance.map((g) => (
                <div
                  key={g.groupId}
                  className="px-2 py-3 border-b border-[rgba(255,255,255,0.05)] grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 items-center text-[13px]"
                >
                  <span className="text-[#f2f2f2]">{g.groupName}</span>
                  <span className="text-[#888]">{g.emailsSent}</span>
                  <span className="text-[#888]">{g.membersReached}</span>
                  <span className="text-[#4a4a4a] text-[12px]">
                    {g.lastSent ? format(parseISO(g.lastSent), "MMM d") : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5 overflow-hidden">
            <h3 className="text-[14px] font-semibold text-[#f2f2f2] mb-3">Top Recipients</h3>
            <div className="border-b border-[rgba(255,255,255,0.06)] px-2 py-2 grid grid-cols-[2fr_1fr_1fr] gap-2 text-[11px] font-medium text-[#4a4a4a] uppercase tracking-widest">
              <span>Name</span>
              <span>Email</span>
              <span>Times</span>
            </div>
            {topRecipients.length === 0 ? (
              <p className="text-[13px] text-[#4a4a4a] py-4">No data yet.</p>
            ) : (
              topRecipients.map((r) => (
                <div
                  key={r.email}
                  className="px-2 py-3 border-b border-[rgba(255,255,255,0.05)] grid grid-cols-[2fr_1fr_1fr] gap-2 items-center text-[13px]"
                >
                  <span className="text-[#f2f2f2]">{r.name || "—"}</span>
                  <span className="text-[#888] font-mono text-[12px] truncate">{r.email}</span>
                  <span className="text-[#888]">{r.timesReached}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5 overflow-hidden">
          <h3 className="text-[14px] font-semibold text-[#f2f2f2] mb-3">Recent Emails</h3>
          <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-2 grid grid-cols-[2fr_1fr_1fr_1fr_90px] gap-2 text-[11px] font-medium text-[#4a4a4a] uppercase tracking-widest">
            <span>Subject</span>
            <span>Groups</span>
            <span>Recipients</span>
            <span>Sent At</span>
            <span>Status</span>
          </div>
          {recentSends.length === 0 ? (
            <p className="text-[13px] text-[#4a4a4a] py-4">No emails yet.</p>
          ) : (
            recentSends.map((r) => (
              <div
                key={r.id}
                className="px-4 py-3.5 border-b border-[rgba(255,255,255,0.05)] grid grid-cols-[2fr_1fr_1fr_1fr_90px] gap-2 items-center text-[13px]"
              >
                <span className="text-[#f2f2f2] truncate">{r.subject || "(no subject)"}</span>
                <span className="text-[#888]">{r.groupIds.length}</span>
                <span className="text-[#888]">{r.recipientCount}</span>
                <span className="text-[#4a4a4a] text-[12px] font-mono">
                  {format(parseISO(r.sentAt), "MMM d, HH:mm")}
                </span>
                <Badge variant={r.status === "sent" ? "success" : "default"}>{r.status}</Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
