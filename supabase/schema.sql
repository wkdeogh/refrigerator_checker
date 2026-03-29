create extension if not exists pgcrypto;

create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  expires_on date not null,
  created_at timestamptz not null default now()
);

create index if not exists food_items_expires_on_idx on public.food_items (expires_on asc);
