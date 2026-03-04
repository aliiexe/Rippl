import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, start_time, end_time, location, group_ids")
    .eq("user_id", userId)
    .gte("start_time", now)
    .order("start_time", { ascending: true })
    .limit(20);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }

  const events = (data ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.start_time,
    start_time: e.start_time,
    end_time: e.end_time,
    location: e.location,
    groupIds: e.group_ids ?? [],
    group_ids: e.group_ids ?? [],
  }));

  return NextResponse.json({ events });
}
