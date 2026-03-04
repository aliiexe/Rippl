import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { getTokensFromCode, createOAuth2Client, setCredentials } from "@/lib/google/auth";
import { upsertGoogleIntegration } from "@/lib/integrations";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/settings?tab=integrations&error=no_code", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
  try {
    const tokens = await getTokensFromCode(code);
    const client = createOAuth2Client();
    setCredentials(client, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expiry_date: tokens.expiry_date != null ? new Date(tokens.expiry_date).toISOString() : null,
    });
    const gmail = google.gmail({ version: "v1", auth: client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const email = (profile.data.emailAddress ?? null) as string | null;
    await upsertGoogleIntegration(userId, "gmail", tokens, { email: email ?? undefined });
    await upsertGoogleIntegration(userId, "calendar", tokens);
  } catch (e) {
    console.error("Google callback error:", e);
    return NextResponse.redirect(new URL("/settings?tab=integrations&error=callback", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
  return NextResponse.redirect(new URL("/settings?tab=integrations&connected=gmail", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
