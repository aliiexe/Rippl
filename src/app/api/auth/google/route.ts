import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuthUrl } from "@/lib/google/auth";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
  try {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("Google auth URL error:", e);
    return NextResponse.redirect(new URL("/settings?tab=integrations&error=google_config", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
}
