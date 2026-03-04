import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getGmailIntegration } from "@/lib/integrations";
import { getValidClient } from "@/lib/google/auth";
import { sendEmailViaGmail } from "@/lib/google/gmail";
import { logActivity } from "@/lib/activity";

type ReminderRow = {
  id: string;
  user_id: string;
  type: string;
  status: string;
  title: string | null;
  scheduled_at: string | null;
  payload: {
    subject?: string;
    body?: string;
    groupIds?: string[];
    excludeEmails?: string[];
    recipient_count?: number;
  } | null;
};

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const headerSecret = req.headers.get("x-cron-secret");
    if (bearer !== secret && headerSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServerSupabaseClient();
  const nowIso = new Date().toISOString();

  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("id, user_id, type, status, title, scheduled_at, payload")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowIso)
    .limit(20);

  if (error) {
    console.error("cron reminders query error:", error);
    return NextResponse.json({ processed: 0, sent: 0, error: "query_failed" }, { status: 500 });
  }

  const rows = (reminders ?? []) as ReminderRow[];
  if (rows.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0 });
  }

  let processed = 0;
  let totalSent = 0;

  for (const row of rows) {
    if (row.type !== "email") {
      // For now, only process email reminders
      continue;
    }
    const userId = row.user_id;
    const payload = row.payload ?? {};
    const subject = (payload.subject ?? row.title ?? "").trim();
    const emailBody = (payload.body ?? "").trim();
    const groupIds = Array.isArray(payload.groupIds) ? payload.groupIds : [];
    if (!subject || !emailBody || groupIds.length === 0) {
      continue;
    }

    try {
      const gmail = await getGmailIntegration(userId);
      if (!gmail?.access_token) {
        console.error("cron reminders: no gmail for user", userId);
        continue;
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

      const { data: userGroups } = await supabase
        .from("groups")
        .select("id")
        .eq("user_id", userId)
        .in("id", groupIds);
      const validGroupIds = (userGroups ?? []).map((g: { id: string }) => g.id);
      if (validGroupIds.length === 0) {
        continue;
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
      const excludeSet = new Set(Array.isArray(payload.excludeEmails) ? payload.excludeEmails : []);
      const recipients = Array.from(byEmail.entries())
        .filter(([email]) => !excludeSet.has(email))
        .map(([email, name]) => ({ email, name }));
      if (recipients.length === 0) {
        continue;
      }

      const fromEmail = gmail.email ?? undefined;
      let sent = 0;
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
          console.error("cron reminders: send failed for", r.email, e);
        }
      }

      if (sent > 0) {
        await supabase.from("sent_emails").insert({
          user_id: userId,
          subject,
          body: emailBody,
          recipient_count: sent,
          group_ids: groupIds,
          status: "sent",
        });
        await logActivity(userId, "reminder_sent", `Scheduled email \"${subject}\" sent to ${sent} people`, {
          reminderId: row.id,
          subject,
          recipientCount: sent,
          groupIds,
        });
        await supabase.from("reminders").update({ status: "sent" }).eq("id", row.id);
        processed++;
        totalSent += sent;
      }
    } catch (err) {
      console.error("cron reminders processing error:", err);
    }
  }

  return NextResponse.json({ processed, sent: totalSent });
}

