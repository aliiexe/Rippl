import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("id, type, title, detail, status, scheduled_at, payload")
    .eq("user_id", userId)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load reminders" }, { status: 500 });
  }

  const reminders = (data ?? []).map((r: any) => ({
    id: r.id,
    type: r.type,
    title: r.title ?? "—",
    detail: r.detail ?? null,
    recipients: r.payload?.recipient_count ?? r.payload?.recipientCount ?? r.payload?.recipients ?? "—",
    scheduledFor: r.scheduled_at,
    status: r.status,
  }));

  return NextResponse.json({ reminders });
}
