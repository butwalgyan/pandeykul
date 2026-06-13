-- Pandey Family Heritage — Supabase schema
-- Run this in your Supabase SQL editor to set up the database.

create extension if not exists "uuid-ossp";

-- Family members
create table if not exists family_members (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  gender text,
  date_of_birth date,
  date_of_death date,
  profile_photo text,
  parent_ids jsonb default '[]',
  spouse_ids jsonb default '[]',
  gotra text,
  ancestral_village text,
  branch text,
  occupation text,
  education text,
  biography text,
  mobile_number text,
  email text,
  nickname text,
  birthplace text,
  current_location text,
  achievements text,
  blood_group text,
  facebook_url text,
  generation integer,
  migration_history jsonb default '[]',
  record_status text default 'approved',
  verification_status text,
  created_by_email text,
  last_updated_by text,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Stories
create table if not exists stories (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text,
  category text default 'other',
  member_id uuid references family_members(id) on delete set null,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Media archive
create table if not exists media (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  file_url text not null,
  type text default 'photo',
  year integer,
  description text,
  event_name text,
  tagged_member_ids jsonb default '[]',
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Documents
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  type text default 'other',
  file_url text not null,
  description text,
  member_id uuid references family_members(id) on delete set null,
  year integer,
  tags jsonb default '[]',
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Invitations
create table if not exists invitations (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  name text,
  role text default 'user',
  message text,
  status text default 'pending',
  invited_by text,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Notifications
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  message text not null,
  type text,
  is_read boolean default false,
  related_member_id uuid references family_members(id) on delete set null,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Content submissions (edits, verifications, story approvals)
create table if not exists content_submissions (
  id uuid primary key default uuid_generate_v4(),
  type text,
  status text default 'pending',
  submission_type text,
  field_name text,
  old_value text,
  proposed_value text,
  reason_or_note text,
  submitted_data jsonb,
  original_data jsonb,
  story_id uuid references stories(id) on delete set null,
  related_family_member_id text,
  submitted_by_email text,
  submitted_by_name text,
  submitted_by_id text,
  submitted_at timestamptz,
  admin_note text,
  admin_comment text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Access logs
create table if not exists access_logs (
  id uuid primary key default uuid_generate_v4(),
  user_email text,
  user_name text,
  action text,
  page_name text,
  page_url text,
  login_time timestamptz,
  last_access_time timestamptz,
  device_info text,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Storage bucket (run in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true);

-- Enable Row Level Security (customize policies for your auth model)
alter table family_members enable row level security;
alter table stories enable row level security;
alter table media enable row level security;
alter table documents enable row level security;
alter table invitations enable row level security;
alter table notifications enable row level security;
alter table content_submissions enable row level security;
alter table access_logs enable row level security;

-- Example permissive policies for authenticated users (adjust for production)
create policy "Authenticated read family_members" on family_members for select to authenticated using (true);
create policy "Authenticated write family_members" on family_members for all to authenticated using (true) with check (true);

create policy "Authenticated read stories" on stories for select to authenticated using (true);
create policy "Authenticated write stories" on stories for all to authenticated using (true) with check (true);

create policy "Authenticated read media" on media for select to authenticated using (true);
create policy "Authenticated write media" on media for all to authenticated using (true) with check (true);

create policy "Authenticated read documents" on documents for select to authenticated using (true);
create policy "Authenticated write documents" on documents for all to authenticated using (true) with check (true);

create policy "Authenticated read invitations" on invitations for select to authenticated using (true);
create policy "Authenticated write invitations" on invitations for all to authenticated using (true) with check (true);

create policy "Authenticated read notifications" on notifications for select to authenticated using (true);
create policy "Authenticated write notifications" on notifications for all to authenticated using (true) with check (true);

create policy "Authenticated read content_submissions" on content_submissions for select to authenticated using (true);
create policy "Authenticated write content_submissions" on content_submissions for all to authenticated using (true) with check (true);

create policy "Authenticated read access_logs" on access_logs for select to authenticated using (true);
create policy "Authenticated write access_logs" on access_logs for all to authenticated using (true) with check (true);
