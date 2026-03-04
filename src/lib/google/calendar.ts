import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

export async function createCalendarEvent(
  auth: OAuth2Client,
  options: {
    summary: string;
    description?: string | null;
    location?: string | null;
    start: string; // ISO
    end: string;   // ISO
    attendees: string[];
    sendUpdates?: boolean;
  }
): Promise<{ id: string; htmlLink?: string }> {
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: options.summary,
      description: options.description ?? undefined,
      location: options.location ?? undefined,
      start: { dateTime: options.start, timeZone: "UTC" },
      end: { dateTime: options.end, timeZone: "UTC" },
      attendees: options.attendees.map((email) => ({ email })),
    },
    sendUpdates: options.sendUpdates ? "all" : undefined,
  });
  const id = res.data.id;
  if (!id) throw new Error("Calendar API did not return event id");
  return { id, htmlLink: res.data.htmlLink ?? undefined };
}
