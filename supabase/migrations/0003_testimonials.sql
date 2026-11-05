-- Public testimonial submissions remain private until Lauren approves them.
create table if not exists public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 120),
  role         text not null check (role in ('author', 'narrator')),
  project      text check (project is null or char_length(project) <= 180),
  quote        text not null check (char_length(btrim(quote)) between 30 and 5000),
  consent      boolean not null default false check (consent),
  status       text not null default 'pending'
               check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now()
);

create index if not exists testimonials_review_order_idx
  on public.testimonials (status, created_at desc);

alter table public.testimonials enable row level security;

drop policy if exists testimonials_anon_read_approved on public.testimonials;
create policy testimonials_anon_read_approved on public.testimonials
  for select to anon using (status = 'approved');

drop policy if exists testimonials_anon_submit_pending on public.testimonials;
create policy testimonials_anon_submit_pending on public.testimonials
  for insert to anon
  with check (status = 'pending' and consent = true);

drop policy if exists testimonials_auth_all on public.testimonials;
create policy testimonials_auth_all on public.testimonials
  for all to authenticated using (true) with check (true);

grant select, insert on public.testimonials to anon;
grant select, insert, update, delete on public.testimonials to authenticated;
