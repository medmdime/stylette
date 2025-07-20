
create policy "User can view select their own profile"
on "public"."profiles"
for select
to authenticated
using (
((select auth.jwt()->>'sub') = (user_id)::text)
);
 