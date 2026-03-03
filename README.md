# CVPadi

Current milestone: Phase 1 foundation through auth and the conversational CV builder. This repo now includes Supabase runtime integration, Sentry wiring, auth flows, and the draft-saving build wizard. Payment, email delivery, and other third-party-dependent features are intentionally paused at Setup Checkpoint 2.

## Included

- Next.js 14 App Router scaffold with TypeScript, Tailwind CSS, and ESLint
- CVPadi app shell, design tokens, and offline-safe local font stacks
- Checkpointed environment template in `.env.example`
- Supabase migration in `supabase/migrations/202603030001_checkpoint1_schema.sql`
- Sentry instrumentation for app, server, edge, and global error boundaries
- Supabase browser/server clients and auth-refresh middleware
- `/login` with email-password, magic-link, and Google sign-in
- `/build` conversational CV wizard with local backup, restore banner, sync indicator, and score suggestions

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

## Setup Checkpoint 2

Stop here before writing any Paystack payment integration. Complete these first:

1. Go to `https://paystack.com` and create an account.
2. Complete business verification if Paystack requires it for live usage.
3. Open `Settings -> API Keys & Webhooks`.
4. Copy the public key into `.env.local` as `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=`.
5. Copy the secret key into `.env.local` as `PAYSTACK_SECRET_KEY=`.
6. Create a webhook endpoint placeholder for the future app URL.
7. Keep the secret key server-only and never expose it in client code.
8. Confirm both keys are present in `.env.local` before any payment code is added.

## Notes

- The schema migration includes RLS, core policies, timestamp triggers, the atomic free-generation counter function, and the AI enhancement queue table.
- The build wizard writes to `localStorage` only as a crash-recovery backup. Supabase remains the primary store.
- Payment, PDF delivery, and email flows are not started yet because those are gated behind later setup checkpoints.
