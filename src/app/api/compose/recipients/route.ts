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

  // Deduplicate by email so each person only appears once,
  // even if they are in multiple selected groups.
  const dedupByEmail = new Map<string, { name: string; email: string; groupName: string }>();

  for (const m of list) {
    const name = (m.name?.trim() || m.email || "").trim();
    const email = (m.email || "").trim();
    if (!email) continue;
    const groupName = groupNamesById[m.group_id] ?? "";

    const existing = dedupByEmail.get(email);
    if (!existing) {
      dedupByEmail.set(email, { name, email, groupName });
    } else {
      let combinedGroupName = existing.groupName || "";
      if (groupName && !combinedGroupName.includes(groupName)) {
        combinedGroupName = combinedGroupName ? `${combinedGroupName} · ${groupName}` : groupName;
      }
      dedupByEmail.set(email, { ...existing, groupName: combinedGroupName });
    }
  }

  const memberList = Array.from(dedupByEmail.values());
  const names = memberList.map((m) => (m.name || m.email).trim()).filter(Boolean);

  return NextResponse.json({
    count: memberList.length,
    names,
    members: memberList,
    recipients: memberList,
  });
}
