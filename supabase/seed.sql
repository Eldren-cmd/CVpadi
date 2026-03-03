begin;

insert into public.job_sources (
  company,
  careers_url,
  industry,
  location_state,
  source_tier
)
values
  ('CBN', 'https://www.cbn.gov.ng/careers', 'Finance', 'Abuja', 'stable'),
  ('FIRS', 'https://www.firs.gov.ng/careers', 'Government', 'Abuja', 'stable'),
  ('NNPC', 'https://nnpcgroup.com/careers', 'Oil and Gas', 'Abuja', 'stable'),
  ('ReliefWeb Nigeria', 'https://reliefweb.int/jobs?source=Nigeria', 'NGO', null, 'ngo'),
  ('DevJobsAfrica', 'https://www.devjobsafrica.org/jobs/country/nigeria', 'NGO', null, 'ngo')
on conflict (careers_url) do nothing;

commit;
