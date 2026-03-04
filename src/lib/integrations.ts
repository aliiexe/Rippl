import { createServerSupabaseClient } from "./supabase";

export type GmailIntegration = {
  access_token: string;
  refresh_token: string | null;
  expiry_date: string | null;
  email: string | null;
};

export type CalendarIntegration = {
  access_token: string;
  refresh_token: string | null;
  expiry_date: string | null;
};

export async function getGmailIntegration(userId: string): Promise<GmailIntegration | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_integrations")
    .select("access_token, refresh_token, expiry_date, data")
    .eq("user_id", userId)
    .eq("type", "gmail")
    .maybeSingle();
  if (error || !data) return null;
  const dataJson = (data.data as { email?: string } | null) ?? {};
  return {
    access_token: data.access_token ?? "",
    refresh_token: data.refresh_token ?? null,
    expiry_date: data.expiry_date ?? null,
    email: dataJson.email ?? null,
  };
}

export async function getCalendarIntegration(userId: string): Promise<CalendarIntegration | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_integrations")
    .select("access_token, refresh_token, expiry_date")
    .eq("user_id", userId)
    .eq("type", "calendar")
    .maybeSingle();
  if (error || !data) return null;
  return {
    access_token: data.access_token ?? "",
    refresh_token: data.refresh_token ?? null,
    expiry_date: data.expiry_date ?? null,
  };
}

export async function upsertGoogleIntegration(
  userId: string,
  type: "gmail" | "calendar",
  tokens: { access_token: string; refresh_token?: string; expiry_date?: number },
  extra?: { email?: string }
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const expiryDate = tokens.expiry_date != null
    ? new Date(tokens.expiry_date).toISOString()
    : null;
  const { data: existing } = await supabase
    .from("user_integrations")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .maybeSingle();
  const payload = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expiry_date: expiryDate,
    data: type === "gmail" && extra?.email ? { email: extra.email } : null,
    updated_at: new Date().toISOString(),
  };
  if (existing?.id) {
    await supabase.from("user_integrations").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("user_integrations").insert({
      user_id: userId,
      type,
      ...payload,
    });
  }
}

export async function deleteIntegration(userId: string, type: "gmail" | "calendar"): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("user_integrations").delete().eq("user_id", userId).eq("type", type);
}
