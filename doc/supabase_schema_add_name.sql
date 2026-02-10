
-- Add name column to watchlist_items
alter table public.watchlist_items 
add column if not exists name text;
