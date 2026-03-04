import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = createServerSupabaseClient();

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (groupError || !group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase.from("group_shares").insert({
    group_id: id,
    from_user_id: userId,
    token,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error("group_shares insert error:", insertError);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL("/groups/import", baseUrl);
  url.searchParams.set("token", token);

  return NextResponse.json({
    url: url.toString(),
    expiresAt,
  });
}

