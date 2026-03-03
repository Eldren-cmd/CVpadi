begin;

create unique index if not exists jobs_source_url_unique_idx
  on public.jobs (source_url)
  where source_url is not null;

create index if not exists jobs_scraped_at_idx
  on public.jobs (scraped_at desc);

commit;
