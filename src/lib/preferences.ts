import { createServerSupabaseClient } from "./supabase";

export type UserPreferences = {
  email_signature: string;
  default_tone: string;
  send_confirmation: boolean;
};

const defaults: UserPreferences = {
  email_signature: "",
  default_tone: "professional",
  send_confirmation: true,
};

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_preferences")
    .select("email_signature, default_tone, send_confirmation")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return { ...defaults };
  return {
    email_signature: data.email_signature ?? defaults.email_signature,
    default_tone: data.default_tone ?? defaults.default_tone,
    send_confirmation: data.send_confirmation ?? defaults.send_confirmation,
  };
}

export async function upsertUserPreferences(
  userId: string,
  prefs: Partial<UserPreferences>
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      email_signature: prefs.email_signature ?? "",
      default_tone: prefs.default_tone ?? "professional",
      send_confirmation: prefs.send_confirmation ?? true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}
