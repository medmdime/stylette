-- First, drop the old policies to avoid conflicts.
-- The original names were "User can view their own tasks" and "Users must insert their own tasks".
DROP POLICY IF EXISTS "User can view their own tasks" ON public.scanned_items;
DROP POLICY IF EXISTS "Users must insert their own tasks" ON public.scanned_items;

-- Add a new policy for SELECT that checks for an active subscription.
-- This ensures users can only see their past scans if they are currently subscribed.
CREATE POLICY "User can view their own scans with an active subscription"
ON public.scanned_items
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() ->> 'sub') = user_id AND
  EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE
      public.subscriptions.user_id = (SELECT auth.jwt() ->> 'sub') AND
      public.subscriptions.status = 'active'
  )
);

-- Add a new policy for INSERT that checks for an active subscription.
-- This prevents non-subscribed users from creating new scans.
CREATE POLICY "User can insert new scans with an active subscription"
ON public.scanned_items
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.jwt() ->> 'sub') = user_id AND
  EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE
      public.subscriptions.user_id = (SELECT auth.jwt() ->> 'sub') AND
      public.subscriptions.status = 'active'
  )
);

-- Add a new policy for DELETE.
-- This allows users to delete their own scans, regardless of subscription status.
-- It's good practice to let users manage their own data.
CREATE POLICY "User can delete their own scans"
ON public.scanned_items
FOR DELETE
TO authenticated
USING (
  (SELECT auth.jwt() ->> 'sub') = user_id
);

-- Add a new policy for UPDATE.
-- Although there is no update functionality in the app currently, it is a good practice to add it.
CREATE POLICY "User can update their own scans with an active subscription"
ON public.scanned_items
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt() ->> 'sub') = user_id AND
  EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE
      public.subscriptions.user_id = (SELECT auth.jwt() ->> 'sub') AND
      public.subscriptions.status = 'active'
  )
);
