import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCalendarIntegration, deleteIntegration } from "@/lib/integrations";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const integration = await getCalendarIntegration(userId);
  if (!integration?.access_token) {
    return NextResponse.json({ connected: false });
  }
  return NextResponse.json({ connected: true });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await deleteIntegration(userId, "calendar");
  return NextResponse.json({ ok: true });
}
