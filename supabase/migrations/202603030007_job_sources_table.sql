begin;

create table if not exists public.job_sources (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  careers_url text not null,
  industry text,
  location_state text default 'Lagos',
  source_tier text not null check (source_tier in ('stable', 'corporate', 'ngo', 'startup')),
  scrape_selector text,
  is_active boolean not null default true,
  last_scraped_at timestamptz,
  last_scrape_status text not null default 'pending' check (last_scrape_status in ('success', 'failed', 'url_changed', 'pending')),
  consecutive_failures integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists job_sources_active_tier_idx
  on public.job_sources (is_active, source_tier);

create unique index if not exists job_sources_careers_url_idx
  on public.job_sources (careers_url);

alter table public.job_sources enable row level security;

commit;
