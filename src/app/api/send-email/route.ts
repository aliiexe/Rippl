import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getGmailIntegration, getCalendarIntegration } from "@/lib/integrations";
import { getUserPreferences } from "@/lib/preferences";
import { getValidClient } from "@/lib/google/auth";
import { sendEmailViaGmail } from "@/lib/google/gmail";
import { createCalendarEvent } from "@/lib/google/calendar";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    subject: string;
    body: string;
    groupIds: string[];
    scheduleAt?: string | null;
    bodyIncludesSignature?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subject = body.subject?.trim();
  let emailBody = body.body?.trim() ?? "";
  const groupIds = Array.isArray(body.groupIds) ? body.groupIds : [];
  if (!subject || !emailBody) {
    return NextResponse.json({ error: "Subject and body required" }, { status: 400 });
  }
  if (groupIds.length === 0) {
    return NextResponse.json({ error: "Select at least one group" }, { status: 400 });
  }

  if (!body.bodyIncludesSignature) {
    const prefs = await getUserPreferences(userId);
    const sig = (prefs.email_signature ?? "").trim();
    if (sig) {
      emailBody = emailBody + (emailBody ? "\n\n" : "") + sig;
    }
  }

  const supabase = createServerSupabaseClient();

  const { data: userGroups } = await supabase
    .from("groups")
    .select("id")
    .eq("user_id", userId)
    .in("id", groupIds);
  const validGroupIds = (userGroups ?? []).map((g: { id: string }) => g.id);
  if (validGroupIds.length === 0) {
    return NextResponse.json({ error: "No valid groups" }, { status: 400 });
  }

  const { data: members } = await supabase
    .from("members")
    .select("name, email")
    .in("group_id", validGroupIds);
  const list = (members ?? []) as { name: string | null; email: string }[];
  const byEmail = new Map<string, string>();
  list.forEach((m) => {
    if (m.email && !byEmail.has(m.email)) {
      byEmail.set(m.email, (m.name?.trim() || m.email.split("@")[0] || "there").trim());
    }
  });
  const recipients = Array.from(byEmail.entries()).map(([email, name]) => ({ email, name }));
  const recipientCount = recipients.length;

  if (body.scheduleAt) {
    const scheduledAt = new Date(body.scheduleAt);
    if (isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Invalid schedule date" }, { status: 400 });
    }
    const { error: reminderError } = await supabase.from("reminders").insert({
      user_id: userId,
      type: "email",
      title: subject,
      detail: `Scheduled email to ${recipientCount} people`,
      status: "scheduled",
      scheduled_at: scheduledAt.toISOString(),
      payload: {
        subject,
        body: emailBody,
        groupIds: validGroupIds,
        recipient_count: recipientCount,
      },
    });
    if (reminderError) {
      console.error(reminderError);
      return NextResponse.json({ error: "Failed to schedule" }, { status: 500 });
    }

    // Add to Google Calendar so it appears on the user's calendar
    let addedToCalendar = false;
    const calendar = await getCalendarIntegration(userId);
    if (calendar?.access_token) {
      try {
        const startIso = scheduledAt.toISOString();
        const endDate = new Date(scheduledAt.getTime() + 15 * 60 * 1000);
        const client = await getValidClient(
          {
            access_token: calendar.access_token,
            refresh_token: calendar.refresh_token,
            expiry_date: calendar.expiry_date,
          },
          async (newTokens) => {
            const { upsertGoogleIntegration } = await import("@/lib/integrations");
            await upsertGoogleIntegration(userId, "calendar", {
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token,
              expiry_date: newTokens.expiry_date,
            });
          }
        );
        await createCalendarEvent(client, {
          summary: `Scheduled email: ${subject.slice(0, 80)}${subject.length > 80 ? "…" : ""}`,
          description: `Scheduled send to ${recipientCount} recipients via Rippl.`,
          start: startIso,
          end: endDate.toISOString(),
          attendees: [],
          sendUpdates: false,
        });
        addedToCalendar = true;
      } catch (e) {
        console.error("Calendar event for scheduled email failed:", e);
      }
    }

    return NextResponse.json({
      scheduled: true,
      message: "Email scheduled.",
      recipientCount,
      addedToCalendar,
    });
  }

  const gmail = await getGmailIntegration(userId);
  if (!gmail?.access_token) {
    return NextResponse.json({ error: "gmail_not_connected" }, { status: 403 });
  }

  const client = await getValidClient(
    {
      access_token: gmail.access_token,
      refresh_token: gmail.refresh_token,
      expiry_date: gmail.expiry_date,
    },
    async (newTokens) => {
      const { upsertGoogleIntegration } = await import("@/lib/integrations");
      await upsertGoogleIntegration(userId, "gmail", {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expiry_date: newTokens.expiry_date,
      });
    }
  );

  const fromEmail = gmail.email ?? undefined;
  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    try {
      const personalizedBody = emailBody.replace(/\{\{name\}\}/g, r.name);
      await sendEmailViaGmail(client, {
        to: r.email,
        subject,
        body: personalizedBody,
        fromEmail,
      });
      sent++;
    } catch (e) {
      console.error("Send failed for", r.email, e);
      failed++;
    }
  }

  if (sent > 0) {
    await supabase.from("sent_emails").insert({
      user_id: userId,
      subject,
      body: emailBody,
      recipient_count: sent,
      group_ids: validGroupIds,
      status: "sent",
    });
    await logActivity(userId, "email_sent", `Sent "${subject}" to ${sent} people`, {
      subject,
      recipientCount: sent,
      groupIds: validGroupIds,
    });
  }

  return NextResponse.json({
    sent,
    failed,
    message: sent > 0 ? "Email sent." : "No emails could be sent.",
    recipientCount: sent,
  });
}
