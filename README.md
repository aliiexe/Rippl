This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Deploy on Vercel (production)

Yes — you can deploy this app on Vercel so different users can sign up and use it as their emailing tool. The app is multi-user: Clerk handles sign-up/sign-in, and all data is scoped by `user_id` in Supabase.

### 1. Deploy to Vercel

- Push your repo to GitHub and [import it in Vercel](https://vercel.com/new).
- After the first deploy, note your production URL (e.g. `https://your-app.vercel.app`).

### 2. Environment variables (Vercel project → Settings → Environment Variables)

Copy from `.env.example` and set these for **Production** (and optionally Preview):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your production URL, e.g. `https://your-app.vercel.app` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From [Clerk Dashboard](https://dashboard.clerk.com) |
| `CLERK_SECRET_KEY` | From Clerk Dashboard |
| `NEXT_PUBLIC_SUPABASE_URL` | From [Supabase](https://supabase.com) project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `GOOGLE_CLIENT_ID` | From [Google Cloud Console](https://console.cloud.google.com) OAuth credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | **Must be** `https://your-app.vercel.app/api/auth/google/callback` |
| `OPENROUTER_API_KEY` | From [OpenRouter](https://openrouter.ai) (for AI compose) |
| `CRON_SECRET` | Optional. If set, cron endpoint requires `Authorization: Bearer <secret>` or `x-cron-secret` (for external cron or Vercel Pro). |

### 3. Clerk (production)

- In Clerk Dashboard → Configure → Paths: set Sign-in and Sign-up URLs if needed.
- Add your Vercel domain to **Allowed redirect URLs** (e.g. `https://your-app.vercel.app/**`).

### 4. Google Cloud Console

- In your OAuth 2.0 Client (APIs & Services → Credentials), add to **Authorized redirect URIs**:  
  `https://your-app.vercel.app/api/auth/google/callback`

### 5. Database

- Run the SQL in `supabase-schema.sql` in your Supabase project (SQL Editor) so tables (including `user_preferences`) exist.
- Ensure RLS policies are in place (they are in the schema).

### 6. Scheduled emails (cron) — free plan

Vercel Cron is paid (Pro only). On the **free Hobby plan**, scheduled emails are sent by an **external cron**:

1. Sign up at **[cron-job.org](https://cron-job.org)** (free).
2. Create a new cron job:
   - **URL:** `https://your-app.vercel.app/api/cron/reminders`
   - **Schedule:** every minute (`* * * * *` or “every 1 min”).
   - **Request method:** GET.
3. (Recommended) In **Vercel → Settings → Environment Variables**, add **`CRON_SECRET`** with a long random string (e.g. from [randomkeygen.com](https://randomkeygen.com)). In cron-job.org, add a **Request Header**:  
   `Authorization` = `Bearer YOUR_CRON_SECRET`  
   (or header name `x-cron-secret`, value = your secret). Then redeploy.
4. Save the cron job. It will call your app every minute so scheduled emails are sent on time.

If you don’t set up the external cron, scheduled emails will only run when someone has the app open in the browser (the app triggers the same logic every 15 seconds when open on localhost; in production you need the external cron).

Redeploy after changing env vars. Users can then sign up, connect Gmail/Calendar, and use the app as their emailing tool.

---

## Getting Started (local)

Copy `.env.example` to `.env.local` and fill in the values. Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
