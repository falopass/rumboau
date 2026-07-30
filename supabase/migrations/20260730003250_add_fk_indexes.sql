begin;

create index if not exists applications_status_slug_idx
  on public.applications(status_slug);
create index if not exists application_funds_sources_bank_id_idx
  on public.application_funds_sources(bank_id);
create index if not exists community_tips_application_id_idx
  on public.community_tips(application_id);
create index if not exists community_tips_participant_id_idx
  on public.community_tips(participant_id);
create index if not exists admin_notes_application_id_idx
  on public.admin_notes(application_id);
create index if not exists admin_notes_author_id_idx
  on public.admin_notes(author_id);
create index if not exists password_reset_tokens_participant_id_idx
  on public.password_reset_tokens(participant_id);
create index if not exists password_reset_tokens_created_by_idx
  on public.password_reset_tokens(created_by);
create index if not exists admin_audit_log_admin_id_idx
  on public.admin_audit_log(admin_id);
create index if not exists participants_membership_verified_by_idx
  on public.participants(membership_verified_by);

commit;
