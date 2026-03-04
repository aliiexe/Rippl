import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data: row } = await supabase
    .from("reminders")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.status !== "scheduled") {
    return NextResponse.json({ error: "Can only delete scheduled reminders" }, { status: 400 });
  }

  const { error } = await supabase.from("reminders").delete().eq("id", id).eq("user_id", userId);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
