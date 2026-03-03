begin;

alter table public.jobs
  add column if not exists is_honeypot boolean not null default false;

alter table public.profiles
  add column if not exists job_access_flag_count integer not null default 0,
  add column if not exists job_access_flag_reason text,
  add column if not exists job_access_flagged_at timestamptz,
  add column if not exists job_access_last_flagged_job_id uuid references public.jobs(id) on delete set null;

create index if not exists jobs_honeypot_idx
  on public.jobs (is_honeypot);

commit;
