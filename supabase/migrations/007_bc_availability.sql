-- Create BC Availability Table
create table bc_availability (
  id uuid primary key default uuid_generate_v4(),
  bc_id uuid not null references blood_collector(id) on delete cascade,
  day_of_week integer check (day_of_week >= 0 and day_of_week <= 6), -- 0 = Sunday, 1 = Monday, etc. Null if specific_date is set.
  specific_date date, -- Null if day_of_week is set.
  start_time time without time zone not null,
  end_time time without time zone not null,
  visit_type text not null default 'both' check (visit_type in ('practice', 'home', 'both')),
  is_blocked boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure that either day_of_week or specific_date is provided, but not both (excluding blocked whole days where time might be full day)
  constraint DayOrDate check (
    (day_of_week is not null and specific_date is null) or 
    (day_of_week is null and specific_date is not null)
  )
);

create index idx_bc_availability_bc_id on bc_availability(bc_id);
create index idx_bc_availability_specific_date on bc_availability(specific_date);

-- Add Date Ranges to Case
alter table "case" add column preferred_date_from date;
alter table "case" add column preferred_date_to date;

-- Enable RLS for BC Availability
alter table bc_availability enable row level security;

create policy "BCs can manage their own availability" on bc_availability
  for all using (bc_id = auth.uid());

create policy "HCs and Patients can read availability" on bc_availability
  for select using (
    exists (select 1 from healthcare_company where id = auth.uid()) or
    exists (select 1 from patient where id = auth.uid())
  );
