# CVPadi

Current milestone: Phase 1 foundation through auth, the conversational CV builder, and the Paystack payment flow. The repo now includes Supabase runtime integration, Sentry wiring, auth flows, the draft-saving build wizard, and server-verified Paystack routes. PDF and email delivery are intentionally paused at Setup Checkpoint 3.

## Included

- Next.js 14 App Router scaffold with TypeScript, Tailwind CSS, and ESLint
- CVPadi app shell, design tokens, and offline-safe local font stacks
- Checkpointed environment template in `.env.example`
- Supabase migration in `supabase/migrations/202603030001_checkpoint1_schema.sql`
- Sentry instrumentation for app, server, edge, and global error boundaries
- Supabase browser/server clients and auth-refresh middleware
- `/login` with email-password, magic-link, and Google sign-in
- `/build` conversational CV wizard with local backup, restore banner, sync indicator, and score suggestions
- `/api/paystack/initialize`, `/api/paystack/status/[reference]`, and `/api/paystack/webhook`
- Builder-side Paystack panel that waits for server confirmation before showing the CV as unlocked

## Local Development

Install dependencies and run the app:

```bash
npm install
npm run dev
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Current Routes

- `/` status page for the current milestone
- `/login` authentication entry
- `/build` protected CV builder
- `/auth/callback` Supabase auth exchange route

## Checkpoint Status

Completed:

1. Setup Checkpoint 0: Sentry
2. Setup Checkpoint 1: Supabase
3. Setup Checkpoint 2: Paystack

## Setup Checkpoint 3

Stop here before writing any email delivery code. Complete these first:

1. Go to `https://resend.com` and create an account.
2. Verify your email.
3. Open `API Keys` and create a key named `cvpadi`.
4. Copy the key into `.env.local` as `RESEND_API_KEY=`.
5. Set `EMAIL_FROM=` in `.env.local`.
6. Add and verify your sending domain, or use Resend's test sender for early development.
7. Do not write email-sending code until those values are ready.

## Notes

- The schema migration includes RLS, core policies, timestamp triggers, the atomic free-generation counter function, and the AI enhancement queue table.
- The build wizard writes to `localStorage` only as a crash-recovery backup. Supabase remains the primary store.
- The Paystack webhook verifies HMAC SHA-512 signatures and checks the amount against a server-side price constant before unlocking a CV.
- PDF delivery and email sending are not started yet because those are gated behind the Resend checkpoint.
