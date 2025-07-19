-- Create the blogs table to store style inspiration and articles.
CREATE TABLE public.blogs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  image_urls TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
 
CREATE POLICY "Allow authenticated users to read blogs"
ON public.blogs
FOR SELECT
TO authenticated
USING (true);
