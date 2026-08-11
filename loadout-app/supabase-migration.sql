-- Run this in Supabase SQL Editor (in addition to the original schema you already ran)

alter table profiles add column if not exists volume_30d numeric default 0;
alter table profiles add column if not exists streak integer default 0;
alter table profiles add column if not exists achievement_ids jsonb default '[]';
alter table profiles add column if not exists achievement_count integer default 0;

alter table chat_messages add column if not exists streak integer;
alter table chat_messages add column if not exists achievement_count integer;
alter table chat_messages add column if not exists is_top boolean;

-- Row Level Security
alter table profiles enable row level security;
alter table workouts enable row level security;
alter table personal_records enable row level security;
alter table user_programs enable row level security;
alter table chat_messages enable row level security;
alter table program_comments enable row level security;
alter table community_activity enable row level security;

-- Profiles: everyone can read (it's the public leaderboard/badge card), only you can write your own
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Workouts, PRs, saved program, activity counters: private to you
create policy "workouts_all_own" on workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "prs_all_own" on personal_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "programs_all_own" on user_programs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "activity_all_own" on community_activity for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Chat and comments: everyone can read, you can only post as yourself
create policy "chat_select_all" on chat_messages for select using (true);
create policy "chat_insert_own" on chat_messages for insert with check (auth.uid() = user_id);
create policy "comments_select_all" on program_comments for select using (true);
create policy "comments_insert_own" on program_comments for insert with check (auth.uid() = user_id);
