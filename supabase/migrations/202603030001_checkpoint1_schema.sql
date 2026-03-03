begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  state_of_origin text,
  location_city text,
  location_state text,
  industry text,
  experience_level text check (experience_level in ('entry', 'mid', 'senior', 'executive')),
  nysc_status text check (nysc_status in ('discharged', 'exempted', 'ongoing', 'not_yet')),
  email_verified boolean not null default false,
  device_fingerprint text,
  free_generations_used integer not null default 0,
  referral_code text unique,
  referred_by uuid references public.profiles(id) on delete set null,
  account_credit_kobo integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  version_number integer not null default 1,
  template_id text not null default 'classic',
  form_data jsonb not null default '{}'::jsonb,
  cv_score integer,
  is_paid boolean not null default false,
  pdf_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cv_id uuid references public.cvs(id) on delete set null,
  paystack_reference text not null unique,
  amount_kobo integer not null,
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  webhook_verified boolean not null default false,
  payment_type text check (payment_type in ('cv_download', 'cv_redownload', 'cover_letter', 'premium_template')),
  created_at timestamptz not null default now()
);

create table public.email_sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sequence_type text not null,
  step_number integer not null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  opened boolean not null default false,
  clicked boolean not null default false
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location_city text,
  location_state text,
  industry text,
  experience_level text,
  description text,
  required_skills jsonb not null default '[]'::jsonb,
  salary_min integer,
  salary_max integer,
  currency text not null default 'NGN',
  source_url text,
  source_type text check (source_type in ('scraped', 'posted', 'partner')),
  is_active boolean not null default true,
  is_verified boolean not null default false,
  scraped_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  match_score integer not null,
  notified boolean not null default false,
  clicked boolean not null default false,
  applied boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company text not null,
  role text not null,
  date_applied date,
  source text,
  status text not null default 'applied' check (status in ('applied', 'interview', 'rejected', 'offer', 'withdrawn')),
  salary_discussed integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text check (category in ('interview', 'salary', 'nysc', 'career', 'referral', 'general')),
  company_tag text,
  title text not null,
  content text not null,
  is_anonymous boolean not null default false,
  upvotes integer not null default 0,
  is_flagged boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.salary_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  company text not null,
  role text not null,
  location_state text,
  years_experience integer,
  salary_annual_kobo bigint not null,
  employment_type text check (employment_type in ('full_time', 'contract', 'part_time')),
  submission_year integer,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.employers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  cac_number text,
  business_email text not null,
  website text,
  industry text,
  tier text not null default 'free' check (tier in ('free', 'starter', 'pro', 'enterprise')),
  is_verified boolean not null default false,
  contact_credits integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.ai_enhancement_queue (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.cvs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  attempts integer not null default 0,
  last_attempted_at timestamptz,
  created_at timestamptz not null default now()
);

create index profiles_referral_code_idx on public.profiles (referral_code);
create index cvs_user_id_idx on public.cvs (user_id);
create index payments_user_id_idx on public.payments (user_id);
create index payments_reference_idx on public.payments (paystack_reference);
create index email_sequences_user_id_idx on public.email_sequences (user_id);
create index jobs_active_expires_idx on public.jobs (is_active, expires_at);
create index job_matches_user_id_idx on public.job_matches (user_id);
create index applications_user_id_idx on public.applications (user_id);
create index community_posts_user_id_idx on public.community_posts (user_id);
create index salary_submissions_company_role_idx on public.salary_submissions (company, role);
create index employers_user_id_idx on public.employers (user_id);
create index ai_enhancement_queue_status_idx on public.ai_enhancement_queue (status, attempts);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_cvs_updated_at
before update on public.cvs
for each row
execute function public.set_updated_at();

create trigger set_applications_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_referral_code text;
begin
  generated_referral_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.profiles (
    id,
    email,
    full_name,
    email_verified,
    referral_code
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email_confirmed_at is not null,
    generated_referral_code
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    email_verified = excluded.email_verified;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.cvs enable row level security;
alter table public.payments enable row level security;
alter table public.email_sequences enable row level security;
alter table public.jobs enable row level security;
alter table public.job_matches enable row level security;
alter table public.applications enable row level security;
alter table public.community_posts enable row level security;
alter table public.salary_submissions enable row level security;
alter table public.employers enable row level security;
alter table public.ai_enhancement_queue enable row level security;

create policy "Users own their profile"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users own their CVs"
on public.cvs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users read their payments"
on public.payments
for select
using (auth.uid() = user_id);

create policy "Users create pending payments"
on public.payments
for insert
with check (
  auth.uid() = user_id
  and status = 'pending'
  and webhook_verified = false
);

create policy "Users read their email sequences"
on public.email_sequences
for select
using (auth.uid() = user_id);

create policy "Jobs readable by authenticated users"
on public.jobs
for select
using (auth.role() = 'authenticated');

create policy "Users own their job matches"
on public.job_matches
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users own their applications"
on public.applications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Community posts readable by authenticated users"
on public.community_posts
for select
using (auth.role() = 'authenticated');

create policy "Users insert their own posts"
on public.community_posts
for insert
with check (auth.uid() = user_id);

create policy "Users update their own posts"
on public.community_posts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users delete their own posts"
on public.community_posts
for delete
using (auth.uid() = user_id);

create policy "Salary submissions readable by authenticated users"
on public.salary_submissions
for select
using (auth.role() = 'authenticated');

create policy "Users own their salary submissions"
on public.salary_submissions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users own their employer record"
on public.employers
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users read their AI queue items"
on public.ai_enhancement_queue
for select
using (auth.uid() = user_id);

create or replace function public.increment_generation_if_allowed(p_user_id uuid, p_limit int)
returns int
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set
    free_generations_used = free_generations_used + 1,
    updated_at = now()
  where id = p_user_id
    and free_generations_used < p_limit
  returning free_generations_used;
$$;

revoke all on function public.increment_generation_if_allowed(uuid, int) from public;
grant execute on function public.increment_generation_if_allowed(uuid, int) to authenticated;

commit;
