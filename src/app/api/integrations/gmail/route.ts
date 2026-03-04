import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getGmailIntegration, deleteIntegration } from "@/lib/integrations";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const integration = await getGmailIntegration(userId);
  if (!integration?.access_token) {
    return NextResponse.json({ connected: false, email: null });
  }
  return NextResponse.json({
    connected: true,
    email: integration.email ?? null,
  });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await deleteIntegration(userId, "gmail");
  return NextResponse.json({ ok: true });
}
