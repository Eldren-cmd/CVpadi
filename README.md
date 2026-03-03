# CVPadi

Checkpoint 1 baseline for CVPadi. This milestone includes only the Next.js project setup and the Supabase schema artifacts. No live Supabase client code, auth flows, storage logic, or product features have been added yet.

## Included

- Next.js 14 App Router scaffold with TypeScript, Tailwind CSS, and ESLint
- CVPadi base metadata, fonts, and design tokens in the app shell
- Checkpoint 1 environment template in `.env.example`
- Supabase migration in `supabase/migrations/202603030001_checkpoint1_schema.sql`

## Local Development

Install dependencies and run the app:

```bash
npm install
npm run dev
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Setup Checkpoint 1

Complete these before writing any Supabase runtime code:

1. Create the Supabase project.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
3. Run `supabase/migrations/202603030001_checkpoint1_schema.sql` in the Supabase SQL Editor.
4. Enable Email auth, magic links, and Google OAuth in Supabase Auth settings.
5. Create the private `cv-assets` storage bucket.
6. Verify RLS before proceeding.

Stop here after Checkpoint 1. Resume feature work only after these steps are complete.

## Notes

- The SQL migration includes RLS, core policies, timestamp triggers, the atomic free-generation counter function, and the AI enhancement queue table.
- The schema is intentionally ahead of feature implementation so the data model is fixed before product code starts.
