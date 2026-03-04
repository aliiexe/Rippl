import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groupIds = req.nextUrl.searchParams.get("groupIds")?.split(",").filter(Boolean) ?? [];
  if (groupIds.length === 0) {
    return NextResponse.json({ count: 0, names: [] });
  }

  const supabase = createServerSupabaseClient();

  const { data: groups } = await supabase
    .from("groups")
    .select("id, name")
    .eq("user_id", userId)
    .in("id", groupIds);

  const validGroups = (groups ?? []) as { id: string; name: string }[];
  const validIds = validGroups.map((g) => g.id);
  const groupNamesById = Object.fromEntries(validGroups.map((g) => [g.id, g.name]));

  if (validIds.length === 0) {
    return NextResponse.json({ count: 0, names: [], members: [], recipients: [] });
  }

  const { data: members } = await supabase
    .from("members")
    .select("name, email, group_id")
    .in("group_id", validIds);

  const list = (members ?? []) as { name: string | null; email: string; group_id: string }[];
  const names = list.map((m) => (m.name?.trim() || m.email || "").trim()).filter(Boolean);
  const memberList = list.map((m) => ({
    name: (m.name?.trim() || m.email || "").trim(),
    email: m.email,
    groupName: groupNamesById[m.group_id] ?? "",
  }));

  return NextResponse.json({
    count: memberList.length,
    names,
    members: memberList,
    recipients: memberList,
  });
}
