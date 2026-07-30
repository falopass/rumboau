begin;

alter table public.participants
  add column phone_e164 text,
  add column membership_verified boolean not null default false,
  add column membership_verified_at timestamptz,
  add column membership_verified_by uuid references public.admin_users(user_id),
  add constraint participants_phone_e164_format
    check (phone_e164 is null or phone_e164 ~ '^\+569[0-9]{8}$');

create unique index participants_phone_e164_unique_idx
  on public.participants (phone_e164)
  where phone_e164 is not null and deleted_at is null;

create or replace function public.mask_chile_phone(p_phone text)
returns text
language sql
immutable
strict
set search_path = public
as $$
  select case
    when p_phone ~ '^\+569[0-9]{8}$'
      then left(p_phone, 4) || 'XXXXX' || right(p_phone, 3)
    else 'Número privado'
  end;
$$;

create or replace function public.create_participant_application(
  p_participant_public_id text,
  p_application_public_id text,
  p_display_name text,
  p_normalized_name text,
  p_phone_e164 text,
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
  if p_phone_e164 !~ '^\+569[0-9]{8}$' then
    raise exception 'invalid_phone';
  end if;

  insert into public.participants (
    public_id, display_name, normalized_name, phone_e164, password_hash, consent_at
  ) values (
    p_participant_public_id, trim(p_display_name), p_normalized_name,
    p_phone_e164, p_password_hash, p_consent_at
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
  ), '[]'::jsonb) as events,
  public.mask_chile_phone(p.phone_e164) as masked_phone,
  p.membership_verified,
  a.granted_at
from public.applications a
join public.participants p on p.id = a.participant_id
join public.application_statuses s on s.slug = a.status_slug
where a.is_public
  and a.deleted_at is null
  and p.deleted_at is null;

revoke all on function public.mask_chile_phone(text) from public, anon, authenticated;
revoke all on function public.create_participant_application(
  text, text, text, text, text, text, timestamptz,
  text, date, integer, text, text, text[], jsonb
) from public, anon, authenticated;

grant execute on function public.mask_chile_phone(text) to service_role;
grant execute on function public.create_participant_application(
  text, text, text, text, text, text, timestamptz,
  text, date, integer, text, text, text[], jsonb
) to service_role;
grant execute on function public.replace_application_children(uuid, text[], jsonb) to service_role;
grant execute on function public.create_application_owned(uuid, text, text, date, integer, text, text, text[], jsonb) to service_role;
grant execute on function public.update_application_owned(uuid, text, text, date, integer, text, text, text[], jsonb) to service_role;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
grant execute on function public.consume_password_reset(text, text) to service_role;

grant select on public.public_application_board to anon, authenticated;

commit;
