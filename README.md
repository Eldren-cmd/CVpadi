# CVPadi

Current milestone: Phase 1 foundation through auth, the conversational CV builder, the Paystack payment flow, and server-side CV delivery. The repo now includes Supabase runtime integration, Sentry wiring, auth flows, the draft-saving build wizard, verified Paystack routes, PDF/JPG asset generation, and Resend-based delivery.

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
- Server-generated PDF and WhatsApp JPG uploads to the private `cv-assets` bucket
- Signed asset delivery route at `/api/cv-assets/[cvId]`
- Resend email delivery with 2-hour signed links
- Email sequence scheduling for abandoned drafts and post-download follow-ups
- Preference centre at `/email-preferences`
- Scheduled sequence processor at `/api/email-sequences/process`
- Free preview route at `/api/cv/preview/[cvId]` rendered server-side into a watermarked 600px canvas preview
- FingerprintJS soft-signal tracking, disposable-email blocking, edge preview rate limiting, and the atomic free-preview counter
- CV score share card route at `/api/og/cv-score?score=87&name=Adaeze`, triggered after the first completed preview
- Public CV score checker at `/check` with `/api/check/score`, supporting pasted text and PDF uploads through `pdf-parse`

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
- `/check` public CV score checker
- `/build` protected CV builder
- `/auth/callback` Supabase auth exchange route
- `/email-preferences` user email cadence controls

## Checkpoint Status

Completed:

1. Setup Checkpoint 0: Sentry
2. Setup Checkpoint 1: Supabase
3. Setup Checkpoint 2: Paystack
4. Setup Checkpoint 3: Resend

## Notes

- The schema migration includes RLS, core policies, timestamp triggers, the atomic free-generation counter function, and the AI enhancement queue table.
- The build wizard writes to `localStorage` only as a crash-recovery backup. Supabase remains the primary store.
- Free preview generation now happens on the server, returns a low-resolution JPG for a `<canvas>` preview, and burns a watermark across the name, phone, and email fields.
- FingerprintJS is only a soft signal. The live guardrail stack combines it with disposable-email blocking, edge rate limiting, reCAPTCHA when keys are configured, and the atomic SQL counter.
- The Paystack webhook verifies HMAC SHA-512 signatures and checks the amount against a server-side price constant before unlocking a CV.
- Delivery assets are generated on the server, stored in the private `cv-assets` bucket, and exposed through 2-hour signed URLs only after verified payment.
- Development email delivery should use Resend's test sender and only reaches the verified Resend inbox. Before production, switch `EMAIL_FROM` to a verified domain sender.
- Before production, register the live Paystack webhook URL as `https://<your-production-domain>/api/paystack/webhook`.
- Before public launch, set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` so the invisible reCAPTCHA checks move from dev-bypass mode to enforced mode.
- The delayed email processor expects `EMAIL_SEQUENCE_CRON_SECRET` and is designed to be invoked by the `supabase/functions/process-email-sequences` wrapper on an hourly cron.
