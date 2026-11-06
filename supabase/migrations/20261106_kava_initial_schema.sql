-- ==============================================================================
-- KaVa: KASSEP Household Survey Platform — Supabase Schema & RLS Policies
-- Doctors Medical Aid Foundation (DMAF) — Kano State, Nigeria
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles & Roles (admin, supervisor, interviewer)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('admin', 'supervisor', 'interviewer')),
  full_name text not null,
  email text not null,
  phone text,
  assigned_lgas text[] default '{}',
  assigned_eas text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enumeration Areas (EAs)
create table if not exists public.enumeration_areas (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  name text not null,
  lga text not null,
  ward text not null,
  segment text default '01',
  latitude double precision not null,
  longitude double precision not null,
  target_households integer default 10,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  supervisor_id uuid references public.profiles(id),
  interviewer_id uuid references public.profiles(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index on EAs
create index if not exists idx_ea_code on public.enumeration_areas(code);
create index if not exists idx_ea_lga on public.enumeration_areas(lga);
create index if not exists idx_ea_status on public.enumeration_areas(status);

-- 3. Form Definitions (versioned survey definitions)
create table if not exists public.form_definitions (
  id uuid default uuid_generate_v4() primary key,
  version text unique not null,
  name text not null,
  definition jsonb not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- 4. Level 1: Households
create table if not exists public.households (
  id uuid default uuid_generate_v4() primary key,
  assessment_hh_id text unique not null,
  ea_id uuid references public.enumeration_areas(id) on delete restrict not null,
  interviewer_id uuid references public.profiles(id) on delete set null not null,
  supervisor_id uuid references public.profiles(id) on delete set null,
  visit_number integer default 1,
  visit_result integer default 1,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  submitted_at timestamptz,
  synced_at timestamptz default now()
);

create index if not exists idx_households_ea on public.households(ea_id);
create index if not exists idx_households_interviewer on public.households(interviewer_id);
create index if not exists idx_households_status on public.households(status);

-- 5. Level 2a: Women (Female Roster)
create table if not exists public.women (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  assessment_hh_id text not null,
  woman_line integer not null,
  woman_id text not null,
  ea_id uuid references public.enumeration_areas(id) not null,
  interviewer_id uuid references public.profiles(id),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (assessment_hh_id, woman_line)
);

create index if not exists idx_women_hh on public.women(assessment_hh_id);
create index if not exists idx_women_ea on public.women(ea_id);

-- 6. Level 2b: Deaths (Household Death Screen & Roster)
create table if not exists public.deaths (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  assessment_hh_id text not null,
  death_line integer not null,
  ea_id uuid references public.enumeration_areas(id) not null,
  interviewer_id uuid references public.profiles(id),
  linked_woman_line integer,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (assessment_hh_id, death_line)
);

create index if not exists idx_deaths_hh on public.deaths(assessment_hh_id);

-- 7. Level 3: Pregnancy Episodes
create table if not exists public.pregnancies (
  id uuid default uuid_generate_v4() primary key,
  pregnancy_id text unique not null, -- format: assessment_hh_id-woman_line-episode_no
  household_id uuid references public.households(id) on delete cascade not null,
  assessment_hh_id text not null,
  woman_line integer not null,
  episode_no integer not null,
  ea_id uuid references public.enumeration_areas(id) not null,
  interviewer_id uuid references public.profiles(id),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pregnancies_hh on public.pregnancies(assessment_hh_id);
create index if not exists idx_pregnancies_woman on public.pregnancies(assessment_hh_id, woman_line);

-- 8. Level 4: Baby Records
create table if not exists public.babies (
  id uuid default uuid_generate_v4() primary key,
  baby_id integer not null,
  pregnancy_id text references public.pregnancies(pregnancy_id) on delete cascade not null,
  assessment_hh_id text not null,
  woman_line integer not null,
  episode_no integer not null,
  ea_id uuid references public.enumeration_areas(id) not null,
  interviewer_id uuid references public.profiles(id),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (pregnancy_id, baby_id)
);

create index if not exists idx_babies_preg on public.babies(pregnancy_id);

-- 9. Review Flags (Quality checks, duplicate warnings, referrals)
create table if not exists public.review_flags (
  id uuid default uuid_generate_v4() primary key,
  type text not null, -- 'duplicate', 'mismatch', 'referral_stillbirth', 'referral_maternal_death', 'inconsistency'
  level text not null check (level in ('household', 'woman', 'death', 'pregnancy', 'baby')),
  record_ref text not null,
  assessment_hh_id text not null,
  ea_id uuid references public.enumeration_areas(id),
  interviewer_id uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'critical')),
  message text not null,
  notes text,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_flags_status on public.review_flags(status);
create index if not exists idx_flags_ea on public.review_flags(ea_id);

-- 10. Audit Log (every correction: who, when, old/new value)
create table if not exists public.audit_log (
  id uuid default uuid_generate_v4() primary key,
  table_name text not null,
  record_id text not null,
  action text not null, -- 'INSERT', 'UPDATE', 'DELETE', 'FLAG_RESOLVE'
  changed_by uuid references public.profiles(id),
  old_values jsonb,
  new_values jsonb,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_audit_record on public.audit_log(record_id);

-- ==============================================================================
-- Row-Level Security (RLS) Setup
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.enumeration_areas enable row level security;
alter table public.form_definitions enable row level security;
alter table public.households enable row level security;
alter table public.women enable row level security;
alter table public.deaths enable row level security;
alter table public.pregnancies enable row level security;
alter table public.babies enable row level security;
alter table public.review_flags enable row level security;
alter table public.audit_log enable row level security;

-- Helper function to get current user's role
create or replace function public.current_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- Helper function to check if user has access to an EA
create or replace function public.user_has_ea_access(ea_code text)
returns boolean as $$
declare
  u_role text;
  u_eas text[];
begin
  select role, assigned_eas into u_role, u_eas from public.profiles where id = auth.uid();
  if u_role = 'admin' then
    return true;
  end if;
  return ea_code = any(u_eas);
end;
$$ language plpgsql stable security definer;

-- Profiles: Users can view own profile; Admins view all; Supervisors view interviewers
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id or public.current_user_role() in ('admin', 'supervisor'));

create policy "Admins manage profiles" on public.profiles
  for all using (public.current_user_role() = 'admin');

-- Enumeration Areas: All authenticated users can read; Admin can insert/update
create policy "Authenticated users read EAs" on public.enumeration_areas
  for select using (auth.role() = 'authenticated');

create policy "Admins manage EAs" on public.enumeration_areas
  for all using (public.current_user_role() = 'admin');

-- Form definitions: Read-only for authenticated; Admin can edit
create policy "Authenticated users read form definitions" on public.form_definitions
  for select using (auth.role() = 'authenticated');

create policy "Admins manage form definitions" on public.form_definitions
  for all using (public.current_user_role() = 'admin');

-- Households:
create policy "Admins full access to households" on public.households
  for all using (public.current_user_role() = 'admin');

create policy "Supervisors read assigned households" on public.households
  for select using (
    public.current_user_role() = 'supervisor'
  );

create policy "Interviewers view and edit own households" on public.households
  for select using (
    public.current_user_role() = 'interviewer' and interviewer_id = auth.uid()
  );

create policy "Interviewers insert own households" on public.households
  for insert with check (
    interviewer_id = auth.uid()
  );

create policy "Interviewers update own draft households" on public.households
  for update using (
    interviewer_id = auth.uid() and status = 'draft'
  );

-- Similar RLS policies apply to women, deaths, pregnancies, babies
create policy "Admins full access to women" on public.women for all using (public.current_user_role() = 'admin');
create policy "Supervisors read women" on public.women for select using (public.current_user_role() = 'supervisor');
create policy "Interviewers manage own women" on public.women for all using (interviewer_id = auth.uid());

create policy "Admins full access to deaths" on public.deaths for all using (public.current_user_role() = 'admin');
create policy "Supervisors read deaths" on public.deaths for select using (public.current_user_role() = 'supervisor');
create policy "Interviewers manage own deaths" on public.deaths for all using (interviewer_id = auth.uid());

create policy "Admins full access to pregnancies" on public.pregnancies for all using (public.current_user_role() = 'admin');
create policy "Supervisors read pregnancies" on public.pregnancies for select using (public.current_user_role() = 'supervisor');
create policy "Interviewers manage own pregnancies" on public.pregnancies for all using (interviewer_id = auth.uid());

create policy "Admins full access to babies" on public.babies for all using (public.current_user_role() = 'admin');
create policy "Supervisors read babies" on public.babies for select using (public.current_user_role() = 'supervisor');
create policy "Interviewers manage own babies" on public.babies for all using (interviewer_id = auth.uid());

-- Review Flags:
create policy "Supervisors and admins manage review flags" on public.review_flags
  for all using (public.current_user_role() in ('admin', 'supervisor'));

create policy "Interviewers view flags for own interviews" on public.review_flags
  for select using (interviewer_id = auth.uid());

-- Audit Log:
create policy "Admins view audit log" on public.audit_log
  for select using (public.current_user_role() = 'admin');

create policy "All authenticated insert audit log" on public.audit_log
  for insert with check (auth.role() = 'authenticated');

