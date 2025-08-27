-- Add team branding fields to teams table
alter table public.teams
  add column if not exists primary_color text,
  add column if not exists secondary_color text,
  add column if not exists tertiary_color text,
  add column if not exists quaternary_color text,
  add column if not exists wiki_logo_url text,
  add column if not exists wiki_wordmark_url text;