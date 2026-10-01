-- Homepage banner settings
-- Applied to the production Supabase project on 2026-10-01.
-- Keep this file as the reproducible reference for the small settings table.

create table if not exists public.homepage_banner_settings (
  id integer primary key check (id = 1),
  banner_size text not null default 'standard'
    check (banner_size in ('compact','standard','large')),
  rotation_seconds integer not null default 5
    check (rotation_seconds between 3 and 15),
  updated_at timestamptz not null default now()
);

alter table public.homepage_banner_settings enable row level security;

revoke all on table public.homepage_banner_settings from anon, authenticated;
grant select on table public.homepage_banner_settings to anon, authenticated;
grant insert, update on table public.homepage_banner_settings to authenticated;

create policy "Public can read homepage banner settings"
on public.homepage_banner_settings
for select
to anon, authenticated
using (true);

create policy "Signed-in users can create homepage banner settings"
on public.homepage_banner_settings
for insert
to authenticated
with check (id = 1);

create policy "Signed-in users can update homepage banner settings"
on public.homepage_banner_settings
for update
to authenticated
using (id = 1)
with check (id = 1);

insert into public.homepage_banner_settings (id)
values (1)
on conflict (id) do nothing;
