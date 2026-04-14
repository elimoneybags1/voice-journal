-- Migration: Add folders table + folder_id on entries
-- Run this in Supabase SQL Editor

create table folders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    parent_id uuid references folders(id) on delete set null,
    icon text default 'folder',
    sort_order integer default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(user_id, name, parent_id)
);

create index folders_user_idx on folders(user_id);

alter table folders enable row level security;

create policy "Users can read own folders"
    on folders for select using (auth.uid() = user_id);
create policy "Users can insert own folders"
    on folders for insert with check (auth.uid() = user_id);
create policy "Users can update own folders"
    on folders for update using (auth.uid() = user_id);
create policy "Users can delete own folders"
    on folders for delete using (auth.uid() = user_id);

create trigger folders_updated_at
    before update on folders
    for each row execute function update_updated_at();

alter table entries add column folder_id uuid references folders(id) on delete set null;
