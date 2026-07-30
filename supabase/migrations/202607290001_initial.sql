begin;

create extension if not exists pgcrypto;
create extension if not exists unaccent;

create table public.application_statuses (
  slug text primary key,
  label text not null,
  tone text not null check (tone in ('waiting', 'action', 'success', 'danger', 'muted')),
  sort_order integer not null,
  active boolean not null default true
);

insert into public.application_statuses (slug, label, tone, sort_order) values
  ('waiting', 'Esperando respuesta', 'waiting', 10),
  ('information_requested', 'Información solicitada', 'action', 20),
  ('documents_sent', 'Documentos enviados', 'action', 30),
  ('granted', 'Granted', 'success', 40),
  ('rejected', 'Rechazada', 'danger', 50),
  ('withdrawn', 'Retirada', 'muted', 60);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  display_name text not null check (char_length(display_name) between 2 and 60),
  normalized_name text not null,
  password_hash text not null,
  password_version integer not null default 1 check (password_version > 0),
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  participant_id uuid not null references public.participants(id) on delete cascade,
  program_type text not null default 'working_holiday_australia',
  origin_country text not null check (char_length(origin_country) between 2 and 60),
  application_date date not null check (application_date <= current_date),
  attempt_number integer not null check (attempt_number between 1 and 20),
  status_slug text not null references public.application_statuses(slug),
  public_notes text check (char_length(public_notes) <= 1000),
  granted_at date,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (participant_id, program_type, attempt_number)
);

create table public.banks (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  normalized_name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.banks (name, normalized_name) values
  ('BancoEstado', 'bancoestado'),
  ('Banco de Chile', 'banco de chile'),
  ('Santander', 'santander'),
  ('BCI', 'bci'),
  ('Scotiabank', 'scotiabank'),
  ('Itaú', 'itau'),
  ('Banco Falabella', 'banco falabella'),
  ('MACH', 'mach'),
  ('Tenpo', 'tenpo'),
  ('Wise', 'wise')
on conflict do nothing;

create table public.application_funds_sources (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  bank_id uuid not null references public.banks(id),
  created_at timestamptz not null default now(),
  unique (application_id, bank_id)
);

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  label text not null check (char_length(label) between 2 and 80),
  state text not null check (state in ('requested', 'pending', 'sent')),
  state_date date,
  public_note text check (char_length(public_note) <= 220),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_tips (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  category text not null check (category in ('process', 'documents', 'banks', 'general')),
  content text not null check (char_length(content) between 8 and 600),
  moderation_status text not null default 'visible'
    check (moderation_status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  actor_type text not null check (actor_type in ('participant', 'admin', 'system')),
  actor_id uuid,
  event_type text not null,
  description text not null check (char_length(description) between 2 and 240),
  metadata jsonb not null default '{}'::jsonb,
  visible_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_id uuid not null references public.admin_users(user_id),
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid not null references public.admin_users(user_id),
  created_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null references public.admin_users(user_id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.rate_limit_buckets (
  key_hash text primary key,
  window_started_at timestamptz not null,
  hit_count integer not null default 1,
  updated_at timestamptz not null default now()
);

create index applications_public_order_idx
  on public.applications (is_public, application_date, status_slug)
  where deleted_at is null;
create index applications_participant_idx on public.applications (participant_id);
create index participants_normalized_name_idx on public.participants (normalized_name);
create index documents_application_state_idx
  on public.application_documents (application_id, state);
create index events_application_created_idx
  on public.application_events (application_id, created_at desc);
create index tips_visible_created_idx
  on public.community_tips (moderation_status, created_at desc);
create index reset_token_lookup_idx
  on public.password_reset_tokens (token_hash, expires_at)
  where used_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger participants_set_updated_at before update on public.participants
for each row execute function public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications
for each row execute function public.set_updated_at();
create trigger documents_set_updated_at before update on public.application_documents
for each row execute function public.set_updated_at();
create trigger tips_set_updated_at before update on public.community_tips
for each row execute function public.set_updated_at();
create trigger admin_notes_set_updated_at before update on public.admin_notes
for each row execute function public.set_updated_at();

create or replace function public.replace_application_children(
  p_application_id uuid,
  p_banks text[],
  p_documents jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bank_name text;
  bank_uuid uuid;
  doc jsonb;
begin
  delete from public.application_funds_sources where application_id = p_application_id;
  foreach bank_name in array coalesce(p_banks, array[]::text[]) loop
    bank_name := trim(bank_name);
    if char_length(bank_name) between 2 and 80 then
      insert into public.banks (name, normalized_name)
      values (bank_name, lower(unaccent(bank_name)))
      on conflict (normalized_name) do update set name = excluded.name
      returning id into bank_uuid;

      insert into public.application_funds_sources (application_id, bank_id)
      values (p_application_id, bank_uuid)
      on conflict do nothing;
    end if;
  end loop;

  delete from public.application_documents where application_id = p_application_id;
  for doc in select value from jsonb_array_elements(coalesce(p_documents, '[]'::jsonb)) loop
    insert into public.application_documents (
      application_id, label, state, state_date, public_note
    ) values (
      p_application_id,
      trim(doc->>'label'),
      doc->>'state',
      nullif(doc->>'stateDate', '')::date,
      nullif(trim(doc->>'publicNote'), '')
    );
  end loop;
end;
$$;

create or replace function public.create_participant_application(
  p_participant_public_id text,
  p_application_public_id text,
  p_display_name text,
  p_normalized_name text,
  p_password_hash text,
  p_consent_at timestamptz,
  p_origin_country text,
  p_application_date date,
  p_attempt_number integer,
  p_status_slug text,
  p_public_notes text,
  p_banks text[],
  p_documents jsonb
)
returns table (participant_id uuid, application_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_participant_id uuid;
  new_application_id uuid;
begin
  insert into public.participants (
    public_id, display_name, normalized_name, password_hash, consent_at
  ) values (
    p_participant_public_id, trim(p_display_name), p_normalized_name, p_password_hash, p_consent_at
  ) returning id into new_participant_id;

  insert into public.applications (
    public_id, participant_id, origin_country, application_date,
    attempt_number, status_slug, public_notes, granted_at
  ) values (
    p_application_public_id, new_participant_id, trim(p_origin_country), p_application_date,
    p_attempt_number, p_status_slug, nullif(trim(p_public_notes), ''),
    case when p_status_slug = 'granted' then current_date else null end
  ) returning id into new_application_id;

  perform public.replace_application_children(new_application_id, p_banks, p_documents);

  insert into public.application_events (
    application_id, actor_type, actor_id, event_type, description
  ) values (
    new_application_id, 'participant', new_participant_id, 'application_created',
    'Postulación agregada al tablero.'
  );

  return query select new_participant_id, new_application_id;
end;
$$;

create or replace function public.create_application_owned(
  p_participant_id uuid,
  p_application_public_id text,
  p_origin_country text,
  p_application_date date,
  p_attempt_number integer,
  p_status_slug text,
  p_public_notes text,
  p_banks text[],
  p_documents jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_application_id uuid;
begin
  if not exists (
    select 1 from public.participants
    where id = p_participant_id and deleted_at is null
  ) then
    raise exception 'participant_not_found';
  end if;

  insert into public.applications (
    public_id, participant_id, origin_country, application_date,
    attempt_number, status_slug, public_notes, granted_at
  ) values (
    p_application_public_id, p_participant_id, trim(p_origin_country), p_application_date,
    p_attempt_number, p_status_slug, nullif(trim(p_public_notes), ''),
    case when p_status_slug = 'granted' then current_date else null end
  ) returning id into new_application_id;

  perform public.replace_application_children(new_application_id, p_banks, p_documents);
  insert into public.application_events (
    application_id, actor_type, actor_id, event_type, description
  ) values (
    new_application_id, 'participant', p_participant_id, 'application_created',
    'Nuevo intento agregado al tablero.'
  );
  return new_application_id;
end;
$$;

create or replace function public.update_application_owned(
  p_participant_id uuid,
  p_application_public_id text,
  p_origin_country text,
  p_application_date date,
  p_attempt_number integer,
  p_status_slug text,
  p_public_notes text,
  p_banks text[],
  p_documents jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  previous_status text;
begin
  select id, status_slug into target_id, previous_status
  from public.applications
  where public_id = p_application_public_id
    and participant_id = p_participant_id
    and deleted_at is null;

  if target_id is null then
    raise exception 'application_not_owned';
  end if;

  update public.applications set
    origin_country = trim(p_origin_country),
    application_date = p_application_date,
    attempt_number = p_attempt_number,
    status_slug = p_status_slug,
    public_notes = nullif(trim(p_public_notes), ''),
    granted_at = case
      when p_status_slug = 'granted' then coalesce(granted_at, current_date)
      else null
    end
  where id = target_id;

  perform public.replace_application_children(target_id, p_banks, p_documents);

  insert into public.application_events (
    application_id, actor_type, actor_id, event_type, description, metadata
  ) values (
    target_id,
    'participant',
    p_participant_id,
    case when previous_status <> p_status_slug then 'status_changed' else 'application_updated' end,
    case when previous_status <> p_status_slug
      then 'Estado actualizado por la persona postulante.'
      else 'Información de la postulación actualizada.'
    end,
    jsonb_build_object('previousStatus', previous_status, 'newStatus', p_status_slug)
  );
  return target_id;
end;
$$;

create or replace function public.consume_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket public.rate_limit_buckets%rowtype;
begin
  insert into public.rate_limit_buckets (key_hash, window_started_at, hit_count)
  values (p_key_hash, now(), 1)
  on conflict (key_hash) do update set
    window_started_at = case
      when public.rate_limit_buckets.window_started_at < now() - make_interval(secs => p_window_seconds)
      then now()
      else public.rate_limit_buckets.window_started_at
    end,
    hit_count = case
      when public.rate_limit_buckets.window_started_at < now() - make_interval(secs => p_window_seconds)
      then 1
      else public.rate_limit_buckets.hit_count + 1
    end,
    updated_at = now()
  returning * into bucket;
  return bucket.hit_count <= p_limit;
end;
$$;

create or replace function public.consume_password_reset(
  p_token_hash text,
  p_password_hash text
)
returns table (participant_id uuid, password_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_token public.password_reset_tokens%rowtype;
  next_version integer;
begin
  select * into target_token
  from public.password_reset_tokens
  where token_hash = p_token_hash
    and used_at is null
    and expires_at > now()
  for update;

  if target_token.id is null then
    raise exception 'reset_token_invalid';
  end if;

  update public.participants
  set password_hash = p_password_hash,
      password_version = password_version + 1
  where id = target_token.participant_id
  returning public.participants.password_version into next_version;

  update public.password_reset_tokens
  set used_at = now()
  where id = target_token.id;

  return query select target_token.participant_id, next_version;
end;
$$;

create or replace view public.public_application_board
with (security_barrier = true)
as
select
  a.id,
  a.public_id,
  p.display_name,
  a.origin_country,
  a.application_date,
  a.attempt_number,
  a.status_slug,
  s.label as status_label,
  s.tone as status_tone,
  a.public_notes,
  a.created_at,
  a.updated_at,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', d.id,
      'label', d.label,
      'state', d.state,
      'stateDate', d.state_date,
      'publicNote', d.public_note
    ) order by d.created_at)
    from public.application_documents d where d.application_id = a.id
  ), '[]'::jsonb) as documents,
  coalesce((
    select jsonb_agg(b.name order by b.name)
    from public.application_funds_sources f
    join public.banks b on b.id = f.bank_id
    where f.application_id = a.id
  ), '[]'::jsonb) as banks,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', t.id,
      'category', t.category,
      'content', t.content,
      'createdAt', t.created_at
    ) order by t.created_at desc)
    from public.community_tips t
    where t.application_id = a.id and t.moderation_status = 'visible'
  ), '[]'::jsonb) as tips,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', e.id,
      'type', e.event_type,
      'description', e.description,
      'createdAt', e.created_at
    ) order by e.created_at desc)
    from public.application_events e
    where e.application_id = a.id and e.visible_public
  ), '[]'::jsonb) as events
from public.applications a
join public.participants p on p.id = a.participant_id
join public.application_statuses s on s.slug = a.status_slug
where a.is_public
  and a.deleted_at is null
  and p.deleted_at is null;

alter table public.application_statuses enable row level security;
alter table public.participants enable row level security;
alter table public.applications enable row level security;
alter table public.banks enable row level security;
alter table public.application_funds_sources enable row level security;
alter table public.application_documents enable row level security;
alter table public.community_tips enable row level security;
alter table public.application_events enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_notes enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.rate_limit_buckets enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.public_application_board to anon, authenticated;

revoke all on function public.replace_application_children(uuid, text[], jsonb) from public, anon, authenticated;
revoke all on function public.create_participant_application(text, text, text, text, text, timestamptz, text, date, integer, text, text, text[], jsonb) from public, anon, authenticated;
revoke all on function public.create_application_owned(uuid, text, text, date, integer, text, text, text[], jsonb) from public, anon, authenticated;
revoke all on function public.update_application_owned(uuid, text, text, date, integer, text, text, text[], jsonb) from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.consume_password_reset(text, text) from public, anon, authenticated;

commit;
