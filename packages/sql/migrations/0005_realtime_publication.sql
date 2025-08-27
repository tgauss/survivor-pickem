-- Enable realtime extension
create extension if not exists realtime;

-- Add tables to realtime publication
alter publication supabase_realtime add table public.picks;
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.weeks;