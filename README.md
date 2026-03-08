# 📄 CVPadi — AI-Powered CV Builder for Nigerian Job Seekers

> A full-stack SaaS platform that helps Nigerian professionals build, 
> score, and deliver standout CVs — with AI enhancement, job matching, 
> and Paystack payments.

[![Live App](https://img.shields.io/badge/Live%20App-cvpadi.vercel.app-C9A84C?style=for-the-badge&logo=vercel&logoColor=white)](https://cvpadi.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-94%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://github.com/Eldren-cmd/CVpadi)
[![Next.js](https://img.shields.io/badge/Next.js%2014-App%20Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://github.com/Eldren-cmd/CVpadi)

---

## 📋 About

CVPadi is a SaaS CV builder built specifically for the Nigerian job 
market. Users go through a conversational build wizard, get an AI 
score on their CV, pay via Paystack to unlock their final PDF, and 
receive AI-enhanced delivery assets by email — all in one flow.

It solves a real problem: most Nigerian job seekers submit generic, 
unoptimised CVs. CVPadi gives them a professional, AI-improved CV 
matched to real job opportunities scraped from the Nigerian market.

---

## ✨ Features

### 🧠 CV Builder
- Conversational wizard with local backup and Supabase sync
- Real-time CV score suggestions as you build
- Watermarked free preview before payment
- CV version timeline with forking — iterate without losing history

### 💳 Payments
- Paystack integration with HMAC SHA-512 webhook verification
- Server-side price validation before unlocking
- Referral system with account credits applied at checkout

### 🤖 AI Enhancement (Claude API)
- Background queue worker powered by Claude Haiku
- Rewrites CV objective, suggests missing skills
- Regenerates PDF + WhatsApp JPG delivery assets post-payment
- Runs every 15 minutes via Supabase Edge Function + pg_cron

### 📬 Email Delivery (Resend)
- PDF and WhatsApp JPG delivered via 2-hour signed URLs
- Abandoned draft email sequences
- Post-download follow-up sequences
- User preference centre at `/email-preferences`

### 💼 Job Matching
- Supabase Edge Function job scraper from legal Nigerian sources
- Auto-disables sources after 3 consecutive failures
- Weighted matching: industry 30% · location 25% · experience 25% · skills 20%
- Only serves matches scoring ≥ 40
- Authenticated job detail route — matched jobs only
- Daily digest at 8:00 AM WAT via pg_cron

### 🛡️ Anti-Abuse Stack
- FingerprintJS soft signal
- Disposable email blocking
- Edge preview rate limiting
- Atomic SQL free-preview counter
- reCAPTCHA (enforced in production)

### 📊 Dashboard
- Application tracker (Applied / Interview / Rejected / Offer)
- Authenticated job matches feed
- CV version history and fork flow
- Referral landing with attribution tracking

### 🌍 Public Pages
- `/check` — public CV score checker (paste text or upload PDF)
- `/salary` — community salary database with magic-link verification
- `/cv-tips/[industry]` — static industry-specific CV guides
- `/nysc` — NYSC CV guide, PPA company directory, after-NYSC advice

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + RLS + pg_cron) |
| Auth | Supabase Auth (email, magic link, Google) |
| Payments | Paystack (webhooks + HMAC verification) |
| AI | Claude API (Haiku — queued enhancement) |
| Email | Resend |
| Storage | Supabase private bucket + signed URLs |
| PDF Generation | Server-side PDF + WhatsApp JPG |
| Job Scraping | Supabase Edge Functions |
| Error Monitoring | Sentry (app, server, edge) |
| Deployment | Vercel |

---

## 🚀 Getting Started
```bash
git clone https://github.com/Eldren-cmd/CVpadi.git
cd CVpadi
npm install
cp .env.example .env.local
# Fill in your env vars (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access |
| `PAYSTACK_SECRET_KEY` | Paystack server key (never expose to client) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `ANTHROPIC_API_KEY` | Claude API key for AI enhancement |
| `RESEND_API_KEY` | Email delivery |
| `EMAIL_SEQUENCE_CRON_SECRET` | Shared secret for cron processors |
| `SENTRY_DSN` | Error monitoring |

---

## 📁 Key Routes

| Route | Description |
|---|---|
| `/` | Landing / milestone status |
| `/login` | Auth (email, magic link, Google) |
| `/build` | Protected CV builder wizard |
| `/check` | Public CV score checker |
| `/salary` | Community salary database |
| `/dashboard` | Authenticated dashboard home |
| `/dashboard/tracker` | Job application tracker |
| `/dashboard/versions` | CV version history + fork |
| `/jobs/[jobId]` | Authenticated matched job detail |
| `/cv-tips/[industry]` | Static industry CV guides |
| `/nysc` | NYSC guide hub |
| `/ref/[code]` | Referral landing |
| `/email-preferences` | Email cadence controls |

---

## 🗄️ Database Migrations

Run in order before testing each feature:
```bash
# Core schema
supabase/migrations/202603030001_checkpoint1_schema.sql

# CV versioning
supabase/migrations/202603030004_cv_versioning.sql

# Referral system
supabase/migrations/202603030005_referral_system.sql

# Job scraper
supabase/migrations/202603030006_job_scraper_source_index.sql
supabase/migrations/202603030007_job_sources_table.sql
supabase/seed.sql

# Scheduled jobs (pg_cron)
supabase/migrations/202603030008_schedule_scrape_jobs.sql
supabase/migrations/202603030010_schedule_process_ai_queue.sql
supabase/migrations/202603030011_schedule_process_job_matches.sql

# Phase 2 fixes
supabase/migrations/202603030012_phase2_loophole_fixes.sql
```

---

## 💡 What I Built & Learned

- Full SaaS architecture with Next.js 14 App Router
- Supabase RLS policies, Edge Functions, and pg_cron scheduling
- Paystack webhook security with HMAC SHA-512 signature verification
- AI integration with Claude API in a queued background worker pattern
- PDF and image asset generation and delivery via signed storage URLs
- Email sequences and preference management with Resend
- Multi-signal anti-abuse stack combining fingerprinting, rate limiting, and atomic SQL
- Weighted job-matching algorithm with automated scraping pipeline

---

## 👤 Author

**Gabriel Adenrele Adegboyega** — Full Stack Developer

[![Portfolio](https://img.shields.io/badge/Portfolio-ga--royal--portfolio.vercel.app-C9A84C?style=flat-square&logo=vercel)](https://ga-royal-portfolio.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Eldren--cmd-1A0A2E?style=flat-square&logo=github)](https://github.com/Eldren-cmd)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-adenrele--gabriel-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/adenrele-gabriel-9332b9183/)

---

## 📄 License

MIT © 2026 Gabriel Adenrele Adegboyega
