alter table public.applications
  drop constraint if exists applications_attempt_number_check;

alter table public.applications
  add constraint applications_attempt_number_check
  check (attempt_number between 0 and 20);
