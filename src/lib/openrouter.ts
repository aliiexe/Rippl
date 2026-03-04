// Primary: OpenRouter's free router (picks an available free model)
const OPENROUTER_DEFAULT_MODEL = "openrouter/free";

// Fallback free models (from OpenRouter API, pricing=0) when primary returns 429/404/503
const FALLBACK_FREE_MODELS = [
  "openrouter/free",
  "google/gemma-3n-e4b-it:free",
  "google/gemma-3n-e2b-it:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "liquid/lfm-2.5-1.2b-instruct:free",
  "stepfun/step-3.5-flash:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "arcee-ai/trinity-mini:free",
];

// Deprecated / removed → use default
const DEPRECATED_MODELS: Record<string, string> = {
  "mistralai/mistral-7b-instruct:free": OPENROUTER_DEFAULT_MODEL,
  "mistral-7b-instruct:free": OPENROUTER_DEFAULT_MODEL,
  "meta-llama/llama-3.2-3b-instruct:free": OPENROUTER_DEFAULT_MODEL,
};

async function callOne(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  prompt: string,
  generateSubject: boolean
): Promise<{ body: unknown; response: Response }> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "",
      "X-Title": "Rippl",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: generateSubject ? 800 : 600,
    }),
  });
  const body = (await response.json()) as { error?: { message?: string }; choices?: { message?: { content?: string } }[] };
  return { body, response };
}

export async function callOpenRouterChat({
  prompt,
  tone,
  model,
  generateSubject,
}: {
  prompt: string;
  tone?: string;
  model?: string;
  generateSubject?: boolean;
}): Promise<{ draft: string; subject?: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("OpenRouter API key is not configured. Add OPENROUTER_API_KEY to .env.local");
  }

  let primaryModel =
    model?.trim() ||
    process.env.OPENROUTER_DEFAULT_MODEL?.trim() ||
    OPENROUTER_DEFAULT_MODEL;
  if (DEPRECATED_MODELS[primaryModel]) {
    primaryModel = DEPRECATED_MODELS[primaryModel];
  }

  const systemPrompt = generateSubject
    ? `You are an expert email writer for team organizers and community managers.
Tone: ${tone || "professional"}. Use {{name}} only in the body where the recipient's name should appear. Do NOT put the recipient's name or {{name}} in the subject—the subject is the same for everyone.
Return valid JSON only, no markdown: { "subject": "...", "body": "..." }. No other text.`
    : `You are an expert email writer for team organizers and community managers.
Write professional, clear, and appropriately toned emails.
Tone: ${tone || "professional"}.
Use {{name}} as a placeholder where the recipient's name should appear.
Return only the email body text, no subject line, no markdown, no preamble.`;

  const modelsToTry = [
    primaryModel,
    ...FALLBACK_FREE_MODELS.filter((m) => m !== primaryModel),
  ];
  let lastError: Error & { status?: number } | null = null;

  for (const modelId of modelsToTry) {
    const { body, response } = await callOne(apiKey, modelId, systemPrompt, prompt, !!generateSubject);

    if (response.ok) {
      const b = body as { choices?: { message?: { content?: string } }[] };
      const content = (b.choices?.[0]?.message?.content || "").trim();
      if (generateSubject) {
        try {
          const parsed = JSON.parse(content.replace(/^```json?\s*|\s*```$/g, "")) as { subject?: string; body?: string };
          return { draft: parsed.body ?? "", subject: parsed.subject ?? "" };
        } catch {
          return { draft: content, subject: "" };
        }
      }
      return { draft: content };
    }

    const msg = (body as { error?: { message?: string } })?.error?.message || response.statusText;
    lastError = new Error(`OpenRouter error: ${response.status} ${msg}`) as Error & { status?: number };
    lastError.status = response.status;
    const tryNext = response.status === 429 || response.status === 404 || response.status === 503;
    if (!tryNext) break;
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error("Failed to generate draft.");
}

