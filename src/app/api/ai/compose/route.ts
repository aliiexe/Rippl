import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { callOpenRouterChat } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, tone, model, generateSubject } = (await req.json()) as {
    prompt?: string;
    tone?: string;
    model?: string;
    generateSubject?: boolean;
  };

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  try {
    const result = await callOpenRouterChat({
      prompt,
      tone: tone ?? "professional",
      model,
      generateSubject: !!generateSubject,
    });
    if (result.subject !== undefined) {
      return NextResponse.json({ subject: result.subject, body: result.draft });
    }
    return NextResponse.json({ draft: result.draft });
  } catch (error) {
    const err = error as Error & { status?: number };
    console.error(err);
    if (err.status === 429 || err.message?.includes("429")) {
      return NextResponse.json(
        { error: "AI is busy. Please try again in a moment." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: err.message?.includes("API key") ? "AI is not configured." : "Failed to generate draft." },
      { status: err.status === 401 ? 401 : 500 }
    );
  }
}

