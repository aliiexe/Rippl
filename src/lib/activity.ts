import { createServerSupabaseClient } from "./supabase";

export type ActivityType = "email_sent" | "event_created" | "group_created" | "reminder_sent";

export async function logActivity(
  userId: string,
  type: ActivityType,
  description: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createServerSupabaseClient();
  await supabase.from("activity_log").insert({
    user_id: userId,
    type,
    description,
    metadata: metadata ?? null,
  });
}

export async function getActivity(userId: string, limit = 20) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, type, description, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}
