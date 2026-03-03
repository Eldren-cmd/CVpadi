begin;

create table if not exists public.nysc_ppa_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  location_state text,
  role_title text,
  rating integer not null check (rating between 1 and 5),
  would_recommend boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists nysc_ppa_reviews_company_state_idx
  on public.nysc_ppa_reviews (company_name, location_state);

alter table public.nysc_ppa_reviews enable row level security;

drop policy if exists "Users read their own NYSC PPA reviews" on public.nysc_ppa_reviews;
create policy "Users read their own NYSC PPA reviews"
on public.nysc_ppa_reviews
for select
using (auth.uid() = user_id);

drop policy if exists "Users insert their own NYSC PPA reviews" on public.nysc_ppa_reviews;
create policy "Users insert their own NYSC PPA reviews"
on public.nysc_ppa_reviews
for insert
with check (auth.uid() = user_id);

commit;
