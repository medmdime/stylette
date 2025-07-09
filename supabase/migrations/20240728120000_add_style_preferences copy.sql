alter table public.profiles
  add column personal_style text,
  add column color_palette text,
  add column go_to_outfit text,
  add column pattern_preference text,
  add column essential_accessory text,
  add column style_goal text,
  add column getting_ready_time text;

-- The existing RLS policies should cover these new columns,
-- as they are applied to the entire row. No need to update policies.
