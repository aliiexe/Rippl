import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getCalendarIntegration } from "@/lib/integrations";
import { getValidClient } from "@/lib/google/auth";
import { createCalendarEvent } from "@/lib/google/calendar";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title: string;
    description?: string | null;
    start?: string;
    end?: string;
    location?: string | null;
    groupIds?: string[];
    reminder?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const startTime = body.start ? new Date(body.start).toISOString() : null;
  const endTime = body.end ? new Date(body.end).toISOString() : null;
  const groupIds = Array.isArray(body.groupIds) ? body.groupIds : [];

  let googleEventId: string | null = null;
  const calendar = await getCalendarIntegration(userId);
  if (calendar?.access_token && startTime && endTime) {
    try {
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
      const attendeeEmails: string[] = [];
      if (groupIds.length > 0) {
        const { data: members } = await supabase
          .from("members")
          .select("email")
          .in("group_id", groupIds);
        const emails = new Set((members ?? []).map((m: { email: string }) => m.email).filter(Boolean));
        attendeeEmails.push(...emails);
      }
      const result = await createCalendarEvent(client, {
        summary: title,
        description: body.description ?? undefined,
        location: body.location ?? undefined,
        start: startTime,
        end: endTime,
        attendees: attendeeEmails,
        sendUpdates: true,
      });
      googleEventId = result.id;
    } catch (e) {
      console.error("Calendar create error:", e);
    }
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      user_id: userId,
      title,
      description: body.description || null,
      location: body.location || null,
      start_time: startTime,
      end_time: endTime,
      group_ids: groupIds,
      google_event_id: googleEventId,
    })
    .select("id, start_time, end_time")
    .single();

  if (eventError) {
    console.error(eventError);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }

  if (body.reminder && event?.start_time) {
    const minutesMap: Record<string, number> = {
      "30": 30,
      "60": 60,
      "1440": 1440,
      "2880": 2880,
      "10080": 10080,
    };
    const mins = minutesMap[body.reminder];
    if (mins) {
      const scheduled = new Date(event.start_time);
      scheduled.setMinutes(scheduled.getMinutes() - mins);
      await supabase.from("reminders").insert({
        user_id: userId,
        type: "event",
        title,
        detail: `Event: ${title}`,
        status: "scheduled",
        scheduled_at: scheduled.toISOString(),
        payload: { event_id: event.id },
      });
    }
  }

  await logActivity(userId, "event_created", `Created event "${title}"`, {
    eventId: event.id,
    googleEventId,
  });

  return NextResponse.json({ event: { id: event.id, googleEventId } });
}
