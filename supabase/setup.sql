-- Wall: run in Supabase → SQL Editor → New query → Run.
-- Creates the posts table, locks it down to read + insert only,
-- turns on Realtime, and adds a public bucket for photos.
-- Safe to run again: re-running it upgrades an older setup (e.g. adds GIFs).

-- 1. Posts table -----------------------------------------------------------

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 1 and 40),
  message     text not null check (char_length(message) <= 280),
  image_url   text check (image_url is null or image_url like '%/storage/v1/object/public/wall-photos/%'),
  created_at  timestamptz not null default now()
);

-- GIFs come from GIPHY; only their media URLs are allowed.
alter table public.posts add column if not exists gif_url text;

alter table public.posts drop constraint if exists posts_gif_url_check;
alter table public.posts add constraint posts_gif_url_check
  check (gif_url is null or gif_url ~ '^https://(media[0-9]*|i)\.giphy\.com/');

-- A post needs text, a photo or a GIF, and can't carry both a photo and a GIF.
alter table public.posts drop constraint if exists posts_not_empty;
alter table public.posts add constraint posts_not_empty
  check (char_length(trim(message)) > 0 or image_url is not null or gif_url is not null);

alter table public.posts drop constraint if exists posts_one_media;
alter table public.posts add constraint posts_one_media
  check (image_url is null or gif_url is null);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- 2. Row Level Security ----------------------------------------------------
-- There is no login, so visitors use the public "anon" key. They may read
-- and add posts, but there are no policies for update or delete, so nobody
-- can edit or remove someone else's post.

alter table public.posts enable row level security;

drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts"
  on public.posts for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can add a post" on public.posts;
create policy "Anyone can add a post"
  on public.posts for insert
  to anon, authenticated
  with check (true);

-- Visitors may only fill in these columns. id and created_at always come
-- from the database, so nobody can backdate or pin a post to the top.
revoke insert, update, delete on public.posts from anon, authenticated;
grant insert (name, message, image_url, gif_url) on public.posts to anon, authenticated;

-- 3. Realtime: push new posts to everyone with the page open ---------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;

-- 4. Photo uploads (optional bonus) ----------------------------------------
-- Public bucket, images only, 5 MB max. Visitors can upload but not
-- overwrite or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wall-photos', 'wall-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload a wall photo" on storage.objects;
create policy "Anyone can upload a wall photo"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'wall-photos');
