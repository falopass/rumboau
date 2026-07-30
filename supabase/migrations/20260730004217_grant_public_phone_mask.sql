begin;

-- The curated public view invokes this pure masking helper. It never returns
-- the stored phone number and direct table access remains revoked.
grant execute on function public.mask_chile_phone(text) to anon, authenticated;

commit;
