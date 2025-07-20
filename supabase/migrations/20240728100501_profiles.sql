create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id text default auth.jwt()->>'sub' ,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  UNIQUE (user_id)
);



alter table "profiles" enable row level security;

-- Policies for profiles table
create policy "User can view their own profile"
on "public"."profiles"
for insert
to authenticated
with check (
((select auth.jwt()->>'sub') = (user_id)::text)
);

create policy "Users can update their own profile"
on "public"."profiles"
for update
to authenticated
using (
  (select auth.jwt()->>'sub') = user_id::text
)
with check (
((select auth.jwt()->>'sub') = (user_id)::text)
);
