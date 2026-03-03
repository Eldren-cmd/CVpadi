begin;

alter table public.payments
  add column if not exists base_amount_kobo integer not null default 0,
  add column if not exists credit_applied_kobo integer not null default 0,
  add column if not exists referrer_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists referral_code_used text,
  add column if not exists referral_credit_kobo integer not null default 0;

update public.payments
set base_amount_kobo = amount_kobo
where base_amount_kobo = 0;

create index if not exists payments_referrer_user_id_idx
  on public.payments (referrer_user_id);

commit;
