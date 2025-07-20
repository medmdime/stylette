create table scanned_items (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null default auth.jwt()->>'sub',
  image_url text,
  result jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table "scanned_items" enable row level security;

create policy "User can view their own tasks"
on "public"."scanned_items"
for select
to authenticated
using (
((select auth.jwt()->>'sub') = (user_id)::text)
);

create policy "Users must insert their own tasks"
on "public"."scanned_items"
as permissive
for insert
to authenticated
with check (
((select auth.jwt()->>'sub') = (user_id)::text)
);
