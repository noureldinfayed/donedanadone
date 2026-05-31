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

-- Service providers (the professionals who fulfil bookings).
-- `services` and `areas` are arrays so one provider can cover multiple of each.
-- Availability is a recurring weekly schedule: working_days (0=Sun..6=Sat) plus
-- a daily window (start_time/end_time, 'HH:MM' 24h). The auto-matcher uses these.
create table if not exists providers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text,
  profession text,                            -- display title, e.g. 'Senior Electrician'
  services text[] default '{}',               -- ['home_chef','plumber', ...]
  areas text[] default '{}',                  -- ['Gurugram','Delhi', ...]
  working_days int[] default '{1,2,3,4,5,6}', -- 0=Sun .. 6=Sat
  start_time text default '09:00',            -- daily window start (24h 'HH:MM')
  end_time text default '18:00',              -- daily window end
  rating numeric default 5.0,
  active boolean default true,
  created_at timestamp default now()
);

create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  booking_display_id text unique,
  user_phone text not null,
  user_name text,
  service_type text,
  area text,
  slot_date text,
  slot_time text,
  address text,
  landmark text,
  notes text,
  provider_id uuid references providers(id) on delete set null,
  payment_status text default 'pending',
  payment_link text,
  amount_paid numeric,
  payment_method text,
  razorpay_payment_id text,
  transaction_timestamp timestamp,
  status text default 'pending',
  created_at timestamp default now()
);

create table if not exists customers (
  id uuid default gen_random_uuid() primary key,
  phone text unique not null,
  name text,
  saved_addresses jsonb default '[]',
  last_address jsonb,
  created_at timestamp default now()
);

create table if not exists blacklist_addresses (
  id uuid default gen_random_uuid() primary key,
  city text not null,
  sector text,
  apartment text,
  reason text,
  created_at timestamp default now()
);

create table if not exists provider_unavailability (
  id uuid default gen_random_uuid() primary key,
  provider_id uuid references providers(id),
  unavailable_from timestamp not null,
  unavailable_until timestamp not null,
  reason text,
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

-- ─── Seed: sample providers ──────────────────────────────────────────────────
insert into providers (name, phone, profession, services, areas, working_days, start_time, end_time, rating) values
  ('Ravi Kumar',    '+91 98100 45612', 'Senior Electrician',  '{electrician,plumber}', '{Delhi,Gurugram}',          '{1,2,3,4,5,6}', '08:00', '20:00', 4.9),
  ('Meena Iyer',    '+91 99710 33845', 'Home Chef',           '{home_chef}',           '{Bangalore,Mumbai}',        '{1,2,3,4,5,6,0}', '10:00', '22:00', 4.8),
  ('Sunita Devi',   '+91 90045 11203', 'House Help Lead',     '{house_help}',          '{Gurugram,Noida,Delhi}',    '{1,2,3,4,5,6}', '07:00', '17:00', 4.7),
  ('Arjun Pillai',  '+91 98911 77520', 'Plumbing Specialist', '{plumber,electrician}', '{Mumbai}',                  '{1,2,3,4,5}',   '09:00', '19:00', 4.6),
  ('Fatima Sheikh', '+91 99580 66471', 'Childcare Pro',       '{babysitter}',          '{Bangalore,Mumbai,Noida}',  '{4,5,6,0}',     '16:00', '23:00', 5.0),
  ('Deepak Verma',  '+91 90192 88134', 'Dog Walker',          '{dog_walker}',          '{Bangalore,Delhi}',         '{1,2,3,4,5,6,0}', '06:00', '10:00', 4.9)
on conflict do nothing;

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Enable realtime on the bookings table so the admin page can subscribe.
alter publication supabase_realtime add table bookings;
