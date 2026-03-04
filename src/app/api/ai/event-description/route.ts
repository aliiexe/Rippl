import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEFAULT_MODEL = "meta-llama/llama-3.2-3b-instruct:free";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventTitle, location, groupName } = (await req.json()) as {
    eventTitle?: string;
    location?: string;
    groupName?: string;
  };

  if (!eventTitle?.trim()) {
    return NextResponse.json({ error: "Event title required" }, { status: 400 });
  }

  if (!OPENROUTER_API_KEY?.trim()) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const prompt = `Write a 2-3 sentence event description for: "${eventTitle}"${location ? ` at ${location}` : ""}${groupName ? ` for ${groupName}` : ""}. Keep it concise and informative. No markdown.`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "",
        "X-Title": "Rippl",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
      }),
    });
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const description = (data.choices?.[0]?.message?.content ?? "").trim();
    return NextResponse.json({ description });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 });
  }
}
