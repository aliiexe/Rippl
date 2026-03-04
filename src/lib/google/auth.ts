import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

export function getRedirectUri(): string {
  const uri = process.env.GOOGLE_REDIRECT_URI;
  if (!uri) throw new Error("GOOGLE_REDIRECT_URI is not set");
  return uri;
}

export function createOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getRedirectUri();
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
  });
}

export function setCredentials(
  client: OAuth2Client,
  tokens: { access_token: string; refresh_token?: string | null; expiry_date?: string | null }
) {
  const expiry = tokens.expiry_date ? new Date(tokens.expiry_date).getTime() : undefined;
  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? undefined,
    expiry_date: expiry,
  });
}

export async function getTokensFromCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
  };
}

/** Returns a client with valid credentials; refreshes and calls onNewTokens if token was refreshed. */
export async function getValidClient(
  tokens: { access_token: string; refresh_token?: string | null; expiry_date?: string | null },
  onNewTokens?: (t: { access_token: string; refresh_token?: string; expiry_date?: number }) => Promise<void>
): Promise<OAuth2Client> {
  const client = createOAuth2Client();
  setCredentials(client, tokens);
  const expiry = tokens.expiry_date ? new Date(tokens.expiry_date).getTime() : 0;
  const now = Date.now();
  if (expiry && now > expiry - 60_000) {
    const { credentials } = await client.refreshAccessToken();
    if (onNewTokens && credentials.access_token) {
      await onNewTokens({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token ?? undefined,
        expiry_date: credentials.expiry_date ?? undefined,
      });
    }
  }
  return client;
}
