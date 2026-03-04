import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("user_id", userId)
    .eq("status", "sent");

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to clear sent" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
