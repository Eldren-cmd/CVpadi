begin;

alter table public.cvs
  add column if not exists branch_id uuid,
  add column if not exists source_cv_id uuid references public.cvs(id) on delete set null,
  add column if not exists is_snapshot boolean not null default false;

update public.cvs
set branch_id = id
where branch_id is null;

alter table public.cvs
  alter column branch_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cvs_branch_id_fkey'
  ) then
    alter table public.cvs
      add constraint cvs_branch_id_fkey
      foreign key (branch_id)
      references public.cvs(id)
      on delete cascade;
  end if;
end
$$;

create index if not exists cvs_branch_snapshot_idx
  on public.cvs (branch_id, is_snapshot, version_number desc);

create index if not exists cvs_source_cv_id_idx
  on public.cvs (source_cv_id);

create or replace function public.ensure_cv_branch_id()
returns trigger
language plpgsql
as $$
begin
  if new.branch_id is null then
    new.branch_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists set_cv_branch_id_before_insert on public.cvs;
create trigger set_cv_branch_id_before_insert
before insert on public.cvs
for each row
execute function public.ensure_cv_branch_id();

create or replace function public.save_cv_version_snapshot(
  p_cv_id uuid,
  p_form_data jsonb,
  p_cv_score integer
)
returns table(id uuid, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_cv public.cvs%rowtype;
begin
  select *
  into current_cv
  from public.cvs
  where public.cvs.id = p_cv_id
    and public.cvs.user_id = auth.uid()
    and public.cvs.is_snapshot = false
  for update;

  if not found then
    raise exception 'CV not found or cannot edit snapshot.';
  end if;

  insert into public.cvs (
    id,
    user_id,
    version_number,
    template_id,
    form_data,
    cv_score,
    is_paid,
    pdf_fingerprint,
    created_at,
    updated_at,
    branch_id,
    source_cv_id,
    is_snapshot
  )
  values (
    gen_random_uuid(),
    current_cv.user_id,
    current_cv.version_number,
    current_cv.template_id,
    current_cv.form_data,
    current_cv.cv_score,
    current_cv.is_paid,
    current_cv.pdf_fingerprint,
    current_cv.updated_at,
    current_cv.updated_at,
    current_cv.branch_id,
    current_cv.id,
    true
  );

  return query
  update public.cvs
  set
    form_data = p_form_data,
    cv_score = p_cv_score,
    version_number = current_cv.version_number + 1,
    pdf_fingerprint = case
      when current_cv.is_paid then null
      else current_cv.pdf_fingerprint
    end,
    updated_at = now()
  where public.cvs.id = current_cv.id
  returning public.cvs.id, public.cvs.updated_at;
end;
$$;

create or replace function public.fork_cv_version(p_source_cv_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_cv public.cvs%rowtype;
  new_cv_id uuid := gen_random_uuid();
begin
  select *
  into source_cv
  from public.cvs
  where public.cvs.id = p_source_cv_id
    and public.cvs.user_id = auth.uid();

  if not found then
    raise exception 'CV version not found.';
  end if;

  insert into public.cvs (
    id,
    user_id,
    version_number,
    template_id,
    form_data,
    cv_score,
    is_paid,
    pdf_fingerprint,
    branch_id,
    source_cv_id,
    is_snapshot
  )
  values (
    new_cv_id,
    source_cv.user_id,
    1,
    source_cv.template_id,
    source_cv.form_data,
    source_cv.cv_score,
    false,
    null,
    new_cv_id,
    source_cv.id,
    false
  );

  return new_cv_id;
end;
$$;

revoke all on function public.save_cv_version_snapshot(uuid, jsonb, integer) from public;
grant execute on function public.save_cv_version_snapshot(uuid, jsonb, integer) to authenticated;

revoke all on function public.fork_cv_version(uuid) from public;
grant execute on function public.fork_cv_version(uuid) to authenticated;

commit;
