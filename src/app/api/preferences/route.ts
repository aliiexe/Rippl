import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPreferences, upsertUserPreferences } from "@/lib/preferences";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const prefs = await getUserPreferences(userId);
  return NextResponse.json(prefs);
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { email_signature?: string; default_tone?: string; send_confirmation?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  await upsertUserPreferences(userId, {
    email_signature: body.email_signature,
    default_tone: body.default_tone,
    send_confirmation: body.send_confirmation,
  });
  return NextResponse.json({ ok: true });
}
