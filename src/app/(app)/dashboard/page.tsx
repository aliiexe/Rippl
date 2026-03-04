import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { DashboardTopbarAction } from "./dashboard-topbar-action";
import { DashboardGreeting } from "./dashboard-greeting";
import { QuickComposeCard } from "./quick-compose-card";
import { Mail, Calendar, Clock } from "lucide-react";
import type { ActivityType } from "@/lib/dashboard";

function ActivityIcon({ type }: { type: ActivityType }) {
  const className = "w-[14px] h-[14px] text-[#888] flex-shrink-0";
  if (type === "email_sent") return <Mail className={className} strokeWidth={1.5} />;
  if (type === "event_created") return <Calendar className={className} strokeWidth={1.5} />;
  return <Clock className={className} strokeWidth={1.5} />;
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const firstName = user?.firstName ?? "there";
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const { stats, activity, groups } = await getDashboardData(userId);
  const activitySlice = activity.slice(0, 8);

  return (
    <>
      <DashboardTopbarAction />

      <div className="flex flex-col gap-8">
        <div>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-[28px] lg:text-[32px] font-bold text-[#f2f2f2]">
              <DashboardGreeting firstName={firstName} />
            </h2>
            <p className="text-[12px] sm:text-[13px] text-[#888] mt-1">{today}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-xl sm:rounded-[14px] p-4 sm:p-5">
              <p className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#f2f2f2]">{stats.groups}</p>
              <p className="text-[11px] sm:text-[12px] text-[#888] mt-1">Groups</p>
            </div>
            <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-xl sm:rounded-[14px] p-4 sm:p-5">
              <p className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#f2f2f2]">{stats.members}</p>
              <p className="text-[11px] sm:text-[12px] text-[#888] mt-1">Members</p>
            </div>
            <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-xl sm:rounded-[14px] p-4 sm:p-5">
              <p className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#f2f2f2]">{stats.emailsSent}</p>
              <p className="text-[11px] sm:text-[12px] text-[#888] mt-1">Emails Sent</p>
            </div>
            <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-xl sm:rounded-[14px] p-4 sm:p-5">
              <p className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#f2f2f2]">{stats.scheduled}</p>
              <p className="text-[11px] sm:text-[12px] text-[#888] mt-1">Scheduled Reminders</p>
            </div>
          </div>

          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-[#f2f2f2]">Activity</h3>
              <Link href="/analytics" className="text-[12px] text-[#ff4000] hover:underline">
                View all →
              </Link>
            </div>
            {activitySlice.length === 0 ? (
              <p className="text-[13px] text-[#4a4a4a] text-center py-8">No activity yet.</p>
            ) : (
              <ul>
                {activitySlice.map((item, i) => (
                  <li
                    key={item.id}
                    className={`flex items-center gap-3 py-3 border-b border-[rgba(255,255,255,0.05)]`}
                  >
                    <ActivityIcon type={item.type} />
                    <span className="flex-1 text-[13px] text-[#f2f2f2]">{item.text}</span>
                    <span className="text-[11px] text-[#4a4a4a] font-mono">{item.at}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[1fr_320px] border-t border-[rgba(255,255,255,0.06)] pt-6 sm:pt-8">
          <QuickComposeCard groups={groups} />
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[#f2f2f2]">Groups</h3>
              <Link href="/groups" className="text-[12px] text-[#ff4000] hover:underline flex-shrink-0 ml-2">
                Manage →
              </Link>
            </div>
            {groups.length === 0 ? (
              <p className="text-[12px] text-[#4a4a4a] py-3">No groups yet.</p>
            ) : (
              <ul className="space-y-0">
                {groups.slice(0, 5).map((g, i) => (
                  <li
                    key={g.id}
                    className={`flex items-center justify-between gap-4 py-3 min-w-0 ${
                      i < Math.min(5, groups.length) - 1 ? "border-b border-[rgba(255,255,255,0.05)]" : ""
                    }`}
                  >
                    <span className="text-[13px] text-[#f2f2f2] truncate min-w-0">
                      {g.emoji} {g.name}
                    </span>
                    <span className="text-[12px] text-[#888] flex-shrink-0 tabular-nums">
                      {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
