import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sent_emails")
    .select("subject, body, recipient_count, group_ids, sent_at, status")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }

  const headers = ["Subject", "Recipient Count", "Sent At", "Status"];
  const rows = (data ?? []).map((r: any) => [
    r.subject ?? "",
    r.recipient_count ?? 0,
    r.sent_at ?? "",
    r.status ?? "",
  ]);
  const csv = [headers.join(","), ...rows.map((row) => row.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=rippl-emails.csv",
    },
  });
}
