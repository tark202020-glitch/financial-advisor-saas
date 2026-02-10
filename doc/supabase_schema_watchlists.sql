
-- Create watchlists table (Groups)
create table if not exists public.watchlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  display_order int default 0,
  created_at timestamptz default now()
);

-- Create watchlist_items table (Stocks within groups)
create table if not exists public.watchlist_items (
  id uuid default gen_random_uuid() primary key,
  watchlist_id uuid references public.watchlists(id) on delete cascade not null,
  symbol text not null,
  market text not null check (market in ('KR', 'US')), -- 'KR' or 'US'
  sector text, -- Optional sector info
  display_order int default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;

-- Policies for watchlists
create policy "Users can view their own watchlists" 
  on public.watchlists for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own watchlists" 
  on public.watchlists for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own watchlists" 
  on public.watchlists for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own watchlists" 
  on public.watchlists for delete 
  using (auth.uid() = user_id);

-- Policies for watchlist_items
create policy "Users can view their own watchlist items" 
  on public.watchlist_items for select 
  using (
    exists (
      select 1 from public.watchlists w 
      where w.id = watchlist_items.watchlist_id 
      and w.user_id = auth.uid()
    )
  );

create policy "Users can insert their own watchlist items" 
  on public.watchlist_items for insert 
  with check (
    exists (
      select 1 from public.watchlists w 
      where w.id = watchlist_items.watchlist_id 
      and w.user_id = auth.uid()
    )
  );

create policy "Users can delete their own watchlist items" 
  on public.watchlist_items for delete 
  using (
    exists (
      select 1 from public.watchlists w 
      where w.id = watchlist_items.watchlist_id 
      and w.user_id = auth.uid()
    )
  );

-- Function to initialize default watchlists for a new user (Optional, can be called manually or via trigger)
