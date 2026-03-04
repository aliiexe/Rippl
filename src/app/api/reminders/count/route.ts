import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ count: 0 });
  }

  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from("reminders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "scheduled");

  if (error) {
    return NextResponse.json({ count: 0 });
  }
  return NextResponse.json({ count: count ?? 0 });
}
