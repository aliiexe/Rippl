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
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("members")
    .delete()
    .match({ id, user_id: userId });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

