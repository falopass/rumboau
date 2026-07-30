-- Development-only fixtures. Do not run in production.
-- Use the application in RUMBO_DEMO_MODE for richer local visual fixtures.

insert into public.application_statuses (slug, label, tone, sort_order)
values ('waiting', 'Esperando respuesta', 'waiting', 10)
on conflict do nothing;

