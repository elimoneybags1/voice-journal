-- Voice Journal Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
create extension if not exists pg_trgm;

-- 1. Entries table
create table entries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    transcript text not null,
    title text not null default 'Untitled',
    summary text default '',
    tags text[] default '{}',
    mood text default 'neutral',
    category text default 'other',
    subcategory text default '',
    people text[] default '{}',
    action_items text[] default '{}',
    audio_url text,
    duration_seconds integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Full-text search index
alter table entries add column fts tsvector
    generated always as (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(transcript, '')), 'C')
    ) stored;

create index entries_fts_idx on entries using gin(fts);
create index entries_user_created_idx on entries(user_id, created_at desc);
create index entries_tags_idx on entries using gin(tags);
create index entries_transcript_trgm_idx on entries using gin(transcript gin_trgm_ops);

-- 2. Profiles table
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    timezone text default 'America/New_York',
    preferences jsonb default '{}',
    created_at timestamptz not null default now()
);

-- 3. Weekly summaries
create table weekly_summaries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    week_start date not null,
    week_end date not null,
    summary text,
    themes text[] default '{}',
    mood_trend text,
    highlights text[] default '{}',
    open_action_items text[] default '{}',
    created_at timestamptz not null default now(),
    unique(user_id, week_start)
);

-- 4. Ask journal messages
create table ask_journal_messages (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamptz not null default now()
);

create index ask_journal_user_idx on ask_journal_messages(user_id, created_at desc);

-- Search function
create or replace function search_entries(
    search_query text,
    user_id_param uuid,
    result_limit integer default 20
)
returns setof entries
language sql
stable
as $$
    select *
    from entries
    where user_id = user_id_param
      and (
          fts @@ websearch_to_tsquery('english', search_query)
          or transcript ilike '%' || search_query || '%'
      )
    order by
        ts_rank(fts, websearch_to_tsquery('english', search_query)) desc,
        created_at desc
    limit result_limit;
$$;

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into profiles (id) values (new.id);
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger entries_updated_at
    before update on entries
    for each row execute function update_updated_at();

-- Row Level Security
alter table entries enable row level security;
alter table profiles enable row level security;
alter table weekly_summaries enable row level security;
alter table ask_journal_messages enable row level security;

-- Policies: users can only access their own data
create policy "Users can read own entries"
    on entries for select using (auth.uid() = user_id);
create policy "Users can insert own entries"
    on entries for insert with check (auth.uid() = user_id);
create policy "Users can update own entries"
    on entries for update using (auth.uid() = user_id);
create policy "Users can delete own entries"
    on entries for delete using (auth.uid() = user_id);

create policy "Users can read own profile"
    on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
    on profiles for update using (auth.uid() = id);

create policy "Users can read own summaries"
    on weekly_summaries for select using (auth.uid() = user_id);
create policy "Users can insert own summaries"
    on weekly_summaries for insert with check (auth.uid() = user_id);

create policy "Users can read own messages"
    on ask_journal_messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages"
    on ask_journal_messages for insert with check (auth.uid() = user_id);

-- Storage bucket for recordings (create in Supabase dashboard or via API)
-- Name: recordings
-- Public: true (audio URLs are unguessable UUIDs)
-- Allowed MIME types: audio/*
-- Max file size: 25MB
