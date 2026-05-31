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

alter table bookings add column if not exists booking_display_id text unique;
alter table bookings add column if not exists amount_paid numeric;
alter table bookings add column if not exists payment_method text;
alter table bookings add column if not exists razorpay_payment_id text;
alter table bookings add column if not exists transaction_timestamp timestamp;
