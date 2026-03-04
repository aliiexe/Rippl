import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";

function randomBoundary(): string {
  return `----=_Part_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function stripHtmlToPlain(html: string): string {
  if (!html || !html.trim()) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type AttachmentInput = {
  filename: string;
  contentType: string;
  content: string; // base64
};

export function buildRFC2822Message(options: {
  to: string;
  subject: string;
  body: string;
  fromEmail?: string;
  htmlBody?: string;
  backgroundColor?: string;
  attachments?: AttachmentInput[];
}): string {
  const { to, subject, body, fromEmail, htmlBody, backgroundColor, attachments } = options;
  const from = fromEmail ?? "noreply@rippl.app";
  const subjectLine = subject.replace(/\r?\n/g, " ");
  const hasHtml = !!htmlBody?.trim();
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  if (!hasHtml && !hasAttachments) {
    const lines = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subjectLine}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ];
    return lines.join("\r\n");
  }

  const mixedBoundary = randomBoundary();
  const altBoundary = randomBoundary();
  const crlf = "\r\n";

  // Build multipart body: first the message body (plain or alternative), then attachments
  let multipartBody = "";

  if (hasHtml) {
    multipartBody += `--${mixedBoundary}${crlf}`;
    multipartBody += "Content-Type: multipart/alternative; boundary=" + altBoundary + crlf + crlf;
    const plain = body.trim() ? body : (htmlBody ? stripHtmlToPlain(htmlBody) : "");
    multipartBody += `--${altBoundary}${crlf}Content-Type: text/plain; charset=utf-8${crlf}${crlf}`;
    multipartBody += plain.replace(/\r?\n/g, crlf) + crlf + crlf;
    const wrappedHtml: string = backgroundColor && htmlBody
      ? `<div style="background:${backgroundColor};padding:20px;min-height:100%;">${htmlBody}</div>`
      : (htmlBody ?? "");
    multipartBody += `--${altBoundary}${crlf}Content-Type: text/html; charset=utf-8${crlf}${crlf}`;
    multipartBody += wrappedHtml + crlf + crlf;
    multipartBody += `--${altBoundary}--${crlf}`;
  } else {
    // Plain text + attachments: first part = multipart/alternative with single text/plain (base64) so clients show body
    multipartBody += `--${mixedBoundary}${crlf}`;
    multipartBody += "Content-Type: multipart/alternative; boundary=" + altBoundary + crlf + crlf;
    multipartBody += `--${altBoundary}${crlf}`;
    multipartBody += "Content-Type: text/plain; charset=utf-8" + crlf;
    multipartBody += "Content-Transfer-Encoding: base64" + crlf + crlf;
    const bodyUtf8 = Buffer.from((body || "").replace(/\r\n/g, "\n"), "utf-8").toString("base64");
    const bodyWrapped = bodyUtf8.replace(/(.{76})/g, "$1" + crlf).replace(/\r\n$/, "");
    multipartBody += bodyWrapped + crlf + crlf;
    multipartBody += `--${altBoundary}--${crlf}`;
  }

  if (hasAttachments) {
    for (const att of attachments) {
      const safeName = att.filename.replace(/[\r\n"]/g, "_");
      multipartBody += `--${mixedBoundary}${crlf}`;
      multipartBody += `Content-Type: ${att.contentType}; name="${safeName}"${crlf}`;
      multipartBody += `Content-Disposition: attachment; filename="${safeName}"${crlf}`;
      multipartBody += "Content-Transfer-Encoding: base64" + crlf + crlf;
      // Base64 wrap at 76 chars per line (RFC 2045)
      const wrapped = att.content.replace(/(.{76})/g, "$1" + crlf).replace(/\r\n$/, "");
      multipartBody += wrapped + crlf + crlf;
    }
  }

  multipartBody += `--${mixedBoundary}--${crlf}`;

  const headerLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subjectLine}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    "",
  ];
  return headerLines.join(crlf) + multipartBody;
}

function toBase64Url(raw: string): string {
  return Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendEmailViaGmail(
  auth: OAuth2Client,
  options: {
    to: string;
    subject: string;
    body: string;
    fromEmail?: string;
    htmlBody?: string;
    backgroundColor?: string;
    attachments?: AttachmentInput[];
  }
): Promise<void> {
  const gmail = google.gmail({ version: "v1", auth });
  const hasAttachments = Array.isArray(options.attachments) && options.attachments.length > 0;
  let raw: string;

  if (hasAttachments) {
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: "windows",
    });
    const from = options.fromEmail ?? "noreply@rippl.app";
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.body,
      attachments: options.attachments!.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, "base64"),
        contentType: a.contentType,
      })),
    });
    const buf = info.message;
    if (!buf || !Buffer.isBuffer(buf)) {
      throw new Error("Nodemailer did not return a message buffer");
    }
    raw = buf.toString("utf-8");
  } else {
    raw = buildRFC2822Message(options);
  }

  const encoded = toBase64Url(raw);
  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });
}
