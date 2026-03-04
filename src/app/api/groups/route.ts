import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  const { data: groupRows, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, description, emoji, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (groupsError) {
    console.error("Groups query error:", groupsError);
    return NextResponse.json({ error: "Failed to load groups" }, { status: 500 });
  }

  const list = groupRows ?? [];
  const groupIds = list.map((g: { id: string }) => g.id);
  const countByGroup: Record<string, number> = {};

  if (groupIds.length > 0) {
    const { data: memberRows, error: membersError } = await supabase
      .from("members")
      .select("group_id")
      .in("group_id", groupIds);

    if (!membersError && memberRows) {
      for (const row of memberRows as { group_id: string }[]) {
        countByGroup[row.group_id] = (countByGroup[row.group_id] ?? 0) + 1;
      }
    }
  }

  const groups = list.map((g: any) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    emoji: g.emoji,
    createdAt: g.created_at,
    memberCount: countByGroup[g.id] ?? 0,
  }));

  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, emoji } = (await req.json()) as {
    name?: string;
    description?: string;
    emoji?: string;
  };

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("groups")
    .insert({
      user_id: userId,
      name,
      description: description ?? null,
      emoji: emoji || "👥",
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }

  return NextResponse.json(
    {
      group: {
        id: data.id,
        name: data.name,
        description: data.description,
        emoji: data.emoji,
        createdAt: data.created_at,
        memberCount: 0,
      },
    },
    { status: 201 }
  );
}

