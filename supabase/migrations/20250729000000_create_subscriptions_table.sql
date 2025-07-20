create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null unique,
  status text,
  period_end_date timestamp with time zone,
  plan_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table "subscriptions" enable row level security;

create policy "Users can view their own subscription"
on "public"."subscriptions"
for select
to authenticated
using (
  ((select auth.jwt()->>'sub') = user_id)
);
