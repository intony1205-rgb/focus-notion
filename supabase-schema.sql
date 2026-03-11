-- Ejecutar todo esto en Supabase SQL Editor
-- Borra todo y empieza limpio

drop table if exists user_config cascade;
drop table if exists calendar_events cascade;
drop table if exists pomodoro_sessions cascade;
drop table if exists tasks cascade;
drop table if exists projects cascade;

create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color text default '#ff6b35',
  created_at timestamptz default now()
);

create table tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  due_date date,
  estimated_pomodoros int default 1,
  completed_pomodoros int default 0,
  completed boolean default false,
  created_at timestamptz default now()
);

create table calendar_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  date date not null,
  start_time time,
  end_time time,
  color text default '#ff6b35',
  created_at timestamptz default now()
);

create table user_config (
  id uuid default gen_random_uuid() primary key,
  work_minutes int default 25,
  short_break_minutes int default 5,
  long_break_minutes int default 15,
  interval_count int default 4,
  sound boolean default true,
  updated_at timestamptz default now()
);

insert into user_config (work_minutes, short_break_minutes, long_break_minutes, interval_count, sound)
values (25, 5, 15, 4, true);

alter table projects disable row level security;
alter table tasks disable row level security;
alter table calendar_events disable row level security;
alter table user_config disable row level security;

grant all on projects to anon, authenticated;
grant all on tasks to anon, authenticated;
grant all on calendar_events to anon, authenticated;
grant all on user_config to anon, authenticated;
