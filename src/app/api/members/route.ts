import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, name, email } = (await req.json()) as {
    groupId?: string;
    name?: string;
    email?: string;
  };

  if (!groupId || !email) {
    return NextResponse.json(
      { error: "groupId and email are required" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("members")
    .insert({
      group_id: groupId,
      user_id: userId,
      name: name ?? null,
      email,
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }

  return NextResponse.json(
    {
      member: {
        id: data.id,
        groupId: data.group_id,
        name: data.name,
        email: data.email,
        createdAt: data.created_at,
      },
    },
    { status: 201 }
  );
}

