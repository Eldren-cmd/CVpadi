begin;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'process-job-matches-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end
$$;

select cron.schedule(
  'process-job-matches-daily',
  '0 7 * * *',
  $$
  select net.http_post(
    url := 'https://xqlstweiuaepslknwobm.supabase.co/functions/v1/process-job-matches',
    headers := '{"Content-Type":"application/json","apikey":"sb_publishable_RBs2Uwj5-ypHo94UBLeyzg_9mILlMwW"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

commit;
