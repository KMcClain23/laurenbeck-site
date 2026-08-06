-- laurenbeckvoice.com — content schema for the admin panel
-- Demos and releases are editable by Lauren; everything else stays in the markup.
--
-- Security model:
--   anon (the key that ships in front-end JS) can read active rows and nothing else.
--   authenticated (Lauren, signed in) can read and write everything.
-- There is no policy granting anon INSERT/UPDATE/DELETE anywhere, by design.

-- ---------------------------------------------------------------- helpers
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------------ demos
create table if not exists public.demos (
  id               uuid primary key default gen_random_uuid(),
  genre            text not null,               -- card heading, e.g. "RomCom"
  tags             text,                        -- e.g. "1st POV · Dual · Banter · Explicit"
  source_title     text,                        -- e.g. "Make the Play"
  source_author    text,                        -- e.g. "Hailey Rodger"
  audio_path       text not null,               -- object path inside the `demos` bucket
  duration_seconds integer,
  sort_order       integer not null default 0,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists demos_order_idx on public.demos (active, sort_order);

drop trigger if exists demos_touch_updated_at on public.demos;
create trigger demos_touch_updated_at
  before update on public.demos
  for each row execute function public.touch_updated_at();

alter table public.demos enable row level security;

drop policy if exists demos_anon_read_active on public.demos;
create policy demos_anon_read_active on public.demos
  for select to anon using (active = true);

drop policy if exists demos_auth_all on public.demos;
create policy demos_auth_all on public.demos
  for all to authenticated using (true) with check (true);

-- --------------------------------------------------------------- releases
create table if not exists public.releases (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  author        text,
  meta          text,                           -- series or genre line
  badge         text,                           -- label shown on the cover
  badge_variant text not null default 'soon'
                check (badge_variant in ('soon', 'new', 'production')),
  cover_path    text,                           -- object path inside the `covers` bucket
  sort_order    integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists releases_order_idx on public.releases (active, sort_order);

drop trigger if exists releases_touch_updated_at on public.releases;
create trigger releases_touch_updated_at
  before update on public.releases
  for each row execute function public.touch_updated_at();

alter table public.releases enable row level security;

drop policy if exists releases_anon_read_active on public.releases;
create policy releases_anon_read_active on public.releases
  for select to anon using (active = true);

drop policy if exists releases_auth_all on public.releases;
create policy releases_auth_all on public.releases
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------- storage
-- Public buckets: the files are meant to be heard and seen by visitors.
-- Public here governs reads only; writes are still gated by the policies below.
insert into storage.buckets (id, name, public)
values ('demos', 'demos', true), ('covers', 'covers', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('demos', 'covers'));

drop policy if exists media_auth_write on storage.objects;
create policy media_auth_write on storage.objects
  for insert to authenticated
  with check (bucket_id in ('demos', 'covers'));

drop policy if exists media_auth_update on storage.objects;
create policy media_auth_update on storage.objects
  for update to authenticated
  using (bucket_id in ('demos', 'covers'));

drop policy if exists media_auth_delete on storage.objects;
create policy media_auth_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('demos', 'covers'));
