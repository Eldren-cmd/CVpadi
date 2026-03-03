begin;

create unique index if not exists ai_enhancement_queue_cv_id_unique_idx
  on public.ai_enhancement_queue (cv_id);

create index if not exists ai_enhancement_queue_created_at_idx
  on public.ai_enhancement_queue (created_at);

commit;
