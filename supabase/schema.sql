-- DoneDanaDone — Supabase schema + seed data
-- Run in the Supabase SQL editor.

-- ─── Schema ──────────────────────────────────────────────────────────────────
create table if not exists service_areas (
  id uuid default gen_random_uuid() primary key,
  area_name text not null,
  serviceable boolean default true
);

create table if not exists slots (
  id uuid default gen_random_uuid() primary key,
  service_type text not null,                 -- 'home_chef' | 'house_help'
  slot_date text not null,                    -- 'today' | 'tomorrow' | 'weekend'
  slot_time text not null,                    -- '09:00 AM' etc.
  available boolean default true
);

create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  user_phone text not null,
  user_name text,
  service_type text,
  area text,
  slot_date text,
  slot_time text,
  address text,
  landmark text,
  notes text,
  payment_status text default 'pending',
  payment_link text,
  status text default 'pending',
  created_at timestamp default now()
);

create table if not exists conversation_state (
  id uuid default gen_random_uuid() primary key,
  phone text unique not null,
  state text not null,
  data jsonb default '{}',
  updated_at timestamp default now()
);

-- ─── Seed: service areas ─────────────────────────────────────────────────────
insert into service_areas (area_name, serviceable) values
  ('Gurugram',  true),
  ('Noida',     true),
  ('Delhi',     true),
  ('Mumbai',    true),
  ('Bangalore', true),
  ('Pune',      false),
  ('Hyderabad', false)
on conflict do nothing;

-- ─── Seed: slots ─────────────────────────────────────────────────────────────
-- Today + tomorrow + weekend slots for both services.
insert into slots (service_type, slot_date, slot_time, available) values
  -- Home Chef · today
  ('home_chef', 'today',    '11:00 AM', true),
  ('home_chef', 'today',    '01:00 PM', true),
  ('home_chef', 'today',    '07:00 PM', true),
  -- Home Chef · tomorrow
  ('home_chef', 'tomorrow', '09:00 AM', true),
  ('home_chef', 'tomorrow', '12:30 PM', true),
  ('home_chef', 'tomorrow', '06:30 PM', true),
  -- Home Chef · weekend
  ('home_chef', 'weekend',  '10:00 AM', true),
  ('home_chef', 'weekend',  '01:00 PM', true),
  ('home_chef', 'weekend',  '07:30 PM', true),

  -- House Help · today
  ('house_help', 'today',    '10:00 AM', true),
  ('house_help', 'today',    '02:00 PM', true),
  ('house_help', 'today',    '05:00 PM', true),
  -- House Help · tomorrow
  ('house_help', 'tomorrow', '08:00 AM', true),
  ('house_help', 'tomorrow', '11:00 AM', true),
  ('house_help', 'tomorrow', '04:00 PM', true),
  -- House Help · weekend
  ('house_help', 'weekend',  '09:00 AM', true),
  ('house_help', 'weekend',  '01:00 PM', true),
  ('house_help', 'weekend',  '05:00 PM', true)
on conflict do nothing;

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Enable realtime on the bookings table so the admin page can subscribe.
alter publication supabase_realtime add table bookings;
