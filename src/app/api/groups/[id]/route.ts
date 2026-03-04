import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
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
    .select("id, name, description, emoji, created_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: members } = await supabase
    .from("members")
    .select("id, name, email")
    .eq("group_id", id)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      emoji: group.emoji,
      createdAt: group.created_at,
    },
    members: (members ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as {
    name?: string;
    description?: string | null;
    emoji?: string;
  };

  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.description === "string" || body.description === null)
    updates.description = body.description;
  if (typeof body.emoji === "string") updates.emoji = body.emoji;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("groups")
    .update(updates)
    .match({ id, user_id: userId });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

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
    .from("groups")
    .delete()
    .match({ id, user_id: userId });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

