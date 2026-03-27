-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Platform Config (Global Settings)
create table platform_config (
  id text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Healthcare Companies (HC)
create table healthcare_company (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  contact_email text not null,
  phone text,
  address jsonb,
  type text not null, -- practice, lab, startup, telemedicine
  status text not null default 'pending', -- pending, active, suspended
  api_enabled boolean default false,
  api_key_hash text,
  default_bc_selection_mode text default 'patient_decides',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Blood Collectors (BC)
create table blood_collector (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  contact_email text not null,
  phone text,
  address jsonb, -- includes geocoordinates
  qualification text not null, -- mfa, nurse, doctor, etc.
  status text not null default 'pending', -- pending, active, suspended
  bio text,
  avatar_url text,
  rating numeric(3,2) default 0.0,
  total_collections integer default 0,
  base_fee numeric(10,2) not null,
  travel_fee_per_km numeric(10,2) not null,
  max_travel_distance_km integer not null,
  equipment jsonb,
  special_experience jsonb, -- array of flags
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Patients
create table patient (
  id uuid primary key references auth.users(id) on delete cascade,
  hc_id uuid not null references healthcare_company(id),
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  gender text not null,
  contact_email text not null,
  phone text not null,
  address jsonb not null,
  insurance_type text,
  guardian_names jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cases
create table "case" (
  id text primary key, -- e.g. BLT-2026-XXXX
  hc_id uuid not null references healthcare_company(id),
  patient_id uuid not null references patient(id),
  test_types jsonb not null,
  preferred_laboratory text,
  urgency_level text not null default 'normal',
  mobility text not null,
  special_case_flags jsonb,
  materials jsonb,
  material_logistics text default 'hc',
  return_logistics text default 'hc',
  bc_selection_mode text not null default 'patient_decides',
  therapeutic_confirmation boolean not null default false,
  status text not null default 'created', -- created, matched, pending_booking, booked, completed, cancelled
  estimated_fees jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Matches (Links a Case to matched Blood Collectors)
create table match (
  id uuid primary key default uuid_generate_v4(),
  case_id text not null references "case"(id) on delete cascade,
  bc_id uuid not null references blood_collector(id),
  rank integer not null,
  score numeric(5,2) not null,
  estimated_travel_km numeric(10,2),
  shortlist_approved_by_hc boolean default false,
  shortlist_sent_at timestamp with time zone,
  patient_selected_at timestamp with time zone,
  auto_assigned boolean default false,
  status text not null default 'pending', -- pending, approved, selected, declined
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Appointments
create table appointment (
  id uuid primary key default uuid_generate_v4(),
  case_id text not null references "case"(id),
  bc_id uuid not null references blood_collector(id),
  patient_id uuid not null references patient(id),
  scheduled_at timestamp with time zone not null,
  status text not null default 'scheduled', -- scheduled, completed, no_show, cancelled
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payments
create table payment (
  id uuid primary key default uuid_generate_v4(),
  case_id text not null references "case"(id),
  amount numeric(10,2) not null,
  currency text default 'EUR',
  status text not null default 'pending', -- pending, holds, captured, refunded
  provider_id text, -- stripe/paypal ID
  fee_breakdown jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews
create table review (
  id uuid primary key default uuid_generate_v4(),
  case_id text not null references "case"(id),
  bc_id uuid not null references blood_collector(id),
  patient_id uuid not null references patient(id),
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Consent Records
create table consent_record (
  id uuid primary key default uuid_generate_v4(),
  case_id text not null references "case"(id),
  patient_id uuid not null references patient(id),
  consent_type text not null, -- blood_draw, data_transfer, gdpr
  agreed boolean not null,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Verification Documents
create table verification_document (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null, -- diploma, license, id
  file_url text not null,
  status text not null default 'pending', -- pending, approved, rejected
  reviewed_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Material Catalog
create table material_catalog (
  id text primary key,
  name text not null,
  description text,
  price numeric(10,2) not null,
  stock integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- API Logs
create table api_log (
  id uuid primary key default uuid_generate_v4(),
  hc_id uuid not null references healthcare_company(id),
  endpoint text not null,
  method text not null,
  request_body text, -- encrypted in prod
  response_code integer not null,
  response_body text, -- encrypted in prod
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index idx_hc_status on healthcare_company(status);
create index idx_bc_status on blood_collector(status);
create index idx_case_hc_id on "case"(hc_id);
create index idx_case_patient_id on "case"(patient_id);
create index idx_case_status on "case"(status);
create index idx_match_case_id on match(case_id);
create index idx_match_bc_id on match(bc_id);
create index idx_appointment_bc_id on appointment(bc_id);
create index idx_appointment_patient_id on appointment(patient_id);
create index idx_appointment_scheduled_at on appointment(scheduled_at);

-- Row Level Security (RLS) Setup
-- Enable RLS
alter table platform_config enable row level security;
alter table healthcare_company enable row level security;
alter table blood_collector enable row level security;
alter table patient enable row level security;
alter table "case" enable row level security;
alter table match enable row level security;
alter table appointment enable row level security;
alter table payment enable row level security;
alter table review enable row level security;
alter table consent_record enable row level security;
alter table verification_document enable row level security;
alter table material_catalog enable row level security;
alter table api_log enable row level security;

-- Example Policies (Admins can view all, HCs view their own, BCs view their own, Patients view their own)
-- These are foundational policies; complex marketplace logic requires more nuanced policies or security definer functions, but this establishes the isolated multi-tenant capability.

-- Healthcare Company: Can select/update their own profile
create policy "HCs can read own profile" on healthcare_company for select using (auth.uid() = id);
create policy "HCs can update own profile" on healthcare_company for update using (auth.uid() = id);

-- Blood Collector: Can select/update their own profile
create policy "BCs can read own profile" on blood_collector for select using (auth.uid() = id);
create policy "BCs can update own profile" on blood_collector for update using (auth.uid() = id);

-- Patients: Can read their own profile, HCs can read their patients
create policy "Patients can read own profile" on patient for select using (auth.uid() = id);
create policy "HCs can read their patients" on patient for select using (
  hc_id = (select id from healthcare_company where id = auth.uid())
);

-- Cases: HCs see their cases, Patients see their cases, BCs see cases they are matched/booked to
create policy "HCs can read their cases" on "case" for select using (hc_id = auth.uid());
create policy "Patients can read their cases" on "case" for select using (patient_id = auth.uid());
create policy "BCs can read booked cases" on "case" for select using (
  id in (select case_id from match where bc_id = auth.uid() and status in ('selected', 'approved'))
);
