import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token?: string } = {};
  try {
    body = (await req.json()) as { token?: string };
  } catch {
    // also allow token via query string only
  }

  const url = new URL(req.url);
  const token = body.token || url.searchParams.get("token") || "";

  if (!token.trim()) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { data: share, error: shareError } = await supabase
    .from("group_shares")
    .select("id, group_id, from_user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (shareError || !share) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "link_expired" }, { status: 410 });
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("name, description, emoji")
    .eq("id", share.group_id)
    .maybeSingle();

  if (groupError || !group) {
    return NextResponse.json({ error: "source_missing" }, { status: 404 });
  }

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("name, email")
    .eq("group_id", share.group_id);

  if (membersError) {
    console.error("members fetch error:", membersError);
    return NextResponse.json({ error: "failed_import" }, { status: 500 });
  }

  const { data: newGroup, error: insertGroupError } = await supabase
    .from("groups")
    .insert({
      user_id: userId,
      name: group.name,
      description: group.description,
      emoji: group.emoji ?? "👥",
    })
    .select("id")
    .single();

  if (insertGroupError || !newGroup) {
    console.error("group insert error:", insertGroupError);
    return NextResponse.json({ error: "failed_import" }, { status: 500 });
  }

  const memberRows = (members ?? [])
    .filter((m) => m.email)
    .map((m) => ({
      user_id: userId,
      group_id: newGroup.id,
      name: m.name,
      email: m.email,
    }));

  if (memberRows.length > 0) {
    const { error: insertMembersError } = await supabase.from("members").insert(memberRows);
    if (insertMembersError) {
      console.error("members insert error:", insertMembersError);
      // still consider import successful, just with fewer members
    }
  }

  return NextResponse.json({
    groupId: newGroup.id,
    importedCount: memberRows.length,
  });
}

