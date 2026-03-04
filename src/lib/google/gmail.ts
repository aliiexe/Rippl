import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

export function buildRFC2822Message(options: {
  to: string;
  subject: string;
  body: string;
  fromEmail?: string;
}): string {
  const { to, subject, body, fromEmail } = options;
  const from = fromEmail ?? "noreply@rippl.app";
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject.replace(/\r?\n/g, " ")}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ];
  return lines.join("\r\n");
}

export async function sendEmailViaGmail(
  auth: OAuth2Client,
  options: {
    to: string;
    subject: string;
    body: string;
    fromEmail?: string;
  }
): Promise<void> {
  const gmail = google.gmail({ version: "v1", auth });
  const raw = buildRFC2822Message(options);
  const encoded = Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });
}
