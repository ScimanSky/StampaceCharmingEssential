begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800,
  null
)
on conflict (id) do update
set public = true,
    file_size_limit = 52428800,
    allowed_mime_types = null;

create table if not exists public.app_templates (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists touch_app_templates_updated_at on public.app_templates;
create trigger touch_app_templates_updated_at
before update on public.app_templates
for each row
execute function public.touch_updated_at();

alter table public.app_templates enable row level security;

drop policy if exists "public can read live template" on public.app_templates;
create policy "public can read live template"
on public.app_templates
for select
to anon, authenticated
using (id = 'live');

drop policy if exists "host can insert live template" on public.app_templates;
create policy "host can insert live template"
on public.app_templates
for insert
to authenticated
with check (
  id = 'live'
  and lower(auth.jwt() ->> 'email') = 'stampacecharming@gmail.com'
);

drop policy if exists "host can update live template" on public.app_templates;
create policy "host can update live template"
on public.app_templates
for update
to authenticated
using (
  id = 'live'
  and lower(auth.jwt() ->> 'email') = 'stampacecharming@gmail.com'
)
with check (
  id = 'live'
  and lower(auth.jwt() ->> 'email') = 'stampacecharming@gmail.com'
);

drop policy if exists "public can view images" on storage.objects;
create policy "public can view images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'images');

drop policy if exists "host can upload images" on storage.objects;
create policy "host can upload images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'images'
  and lower(auth.jwt() ->> 'email') = 'stampacecharming@gmail.com'
);

drop policy if exists "host can update images" on storage.objects;
create policy "host can update images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'images'
  and lower(auth.jwt() ->> 'email') = 'stampacecharming@gmail.com'
)
with check (
  bucket_id = 'images'
  and lower(auth.jwt() ->> 'email') = 'stampacecharming@gmail.com'
);

drop policy if exists "host can delete images" on storage.objects;
create policy "host can delete images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'images'
  and lower(auth.jwt() ->> 'email') = 'stampacecharming@gmail.com'
);

drop policy if exists "public can view media" on storage.objects;
create policy "public can view media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'media');

drop policy if exists "host can upload media" on storage.objects;
create policy "host can upload media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media'
  and lower(auth.jwt() ->> 'email') = 'stampacecharming@gmail.com'
);

drop policy if exists "host can update media" on storage.objects;
create policy "host can update media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media'
  and lower(auth.jwt() ->> 'email') = 'stampacecharming@gmail.com'
)
with check (
  bucket_id = 'media'
  and lower(auth.jwt() ->> 'email') = 'stampacecharming@gmail.com'
);

drop policy if exists "host can delete media" on storage.objects;
create policy "host can delete media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media'
  and lower(auth.jwt() ->> 'email') = 'stampacecharming@gmail.com'
);

insert into public.app_templates (id, content)
select
  'live',
  '{
    "appName": "Stampace Charming",
    "address": "Via Domenico Alberto Azuni, 2, 09124 Cagliari, Italia",
    "license": "CIN: IT092009C2000R8066",
    "footer": {
      "name": "Stampace Charming",
      "subtitle": "Luxury apartment",
      "lines": [
        "Via Domenico Alberto Azuni, 2, 09124 Cagliari, Italia",
        "CIN: IT092009C2000R8066"
      ]
    },
    "enabledLocales": ["it", "en", "de"],
    "locales": {
      "it": {
        "subtitle": "Luxury apartment",
        "sections": []
      }
    }
  }'::jsonb
where not exists (
  select 1 from public.app_templates where id = 'live'
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_templates'
  ) then
    alter publication supabase_realtime add table public.app_templates;
  end if;
end;
$$;

commit;
