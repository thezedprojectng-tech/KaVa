-- ==============================================================================
-- KaVa: KASSEP Household Survey Platform — Supabase Schema & RLS Policies
-- Client: Doctors Medical Aid Foundation (DMAF) — Kano State, Nigeria
--
-- Features & Architecture:
--   • Idempotent & Re-runnable: uses IF NOT EXISTS, DROP POLICY IF EXISTS,
--     DROP TRIGGER IF EXISTS, and ALTER TABLE guards so it can run repeatedly.
--   • UUID EA Access Control: user_has_ea_access(uuid) evaluates role, LGA, and EA.
--   • Multi-level Row-Level Security: Admin, Supervisor, Interviewer scoping.
--   • Survey Data Integrity: Interviewers cannot delete survey data; edits restricted
--     to draft records in assigned EAs.
--   • Security Definer Triggers: Immutable audit logging and updated_at tracking.
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES & ROLES
-- ==============================================================================
create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  role          text not null check (role in ('admin', 'supervisor', 'interviewer')),
  full_name     text not null,
  email         text not null,
  phone         text,
  assigned_lgas text[] default '{}',
  assigned_eas  text[] default '{}',
  status        text not null default 'active' check (status in ('active', 'inactive')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Ensure column exists if table was created in an earlier migration
alter table public.profiles
  add column if not exists status text not null default 'active' check (status in ('active', 'inactive'));

-- ==============================================================================
-- 2. ENUMERATION AREAS (EAs)
-- ==============================================================================
create table if not exists public.enumeration_areas (
  id                  uuid default uuid_generate_v4() primary key,
  code                text unique not null,
  name                text not null,
  lga                 text not null,
  ward                text not null,
  segment             text default '01',
  latitude            double precision not null,
  longitude           double precision not null,
  target_households   integer default 10,
  status              text not null default 'not_started'
                        check (status in ('not_started', 'in_progress', 'completed')),
  supervisor_id       uuid references public.profiles(id),
  interviewer_id      uuid references public.profiles(id),
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists idx_ea_code   on public.enumeration_areas(code);
create index if not exists idx_ea_lga    on public.enumeration_areas(lga);
create index if not exists idx_ea_status on public.enumeration_areas(status);

-- ==============================================================================
-- 3. FORM DEFINITIONS (Versioned survey JSON definitions)
-- ==============================================================================
create table if not exists public.form_definitions (
  id         uuid default uuid_generate_v4() primary key,
  version    text unique not null,
  name       text not null,
  definition jsonb not null,
  active     boolean default true,
  created_at timestamptz default now()
);

-- ==============================================================================
-- 4. HOUSEHOLDS (Level 1)
-- Note: ON DELETE RESTRICT on interviewer_id (removes previous NOT NULL / SET NULL conflict)
-- ==============================================================================
create table if not exists public.households (
  id               uuid default uuid_generate_v4() primary key,
  assessment_hh_id text unique not null,
  ea_id            uuid references public.enumeration_areas(id) on delete restrict not null,
  interviewer_id   uuid references public.profiles(id) on delete restrict not null,
  supervisor_id    uuid references public.profiles(id) on delete set null,
  visit_number     integer default 1,
  visit_result     integer default 1,
  status           text not null default 'draft'
                     check (status in ('draft', 'submitted', 'reviewed')),
  data             jsonb not null default '{}'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  submitted_at     timestamptz,
  synced_at        timestamptz default now()
);

create index if not exists idx_households_ea          on public.households(ea_id);
create index if not exists idx_households_interviewer on public.households(interviewer_id);
create index if not exists idx_households_status      on public.households(status);

-- ==============================================================================
-- 5. WOMEN (Level 2a — Female Roster)
-- ==============================================================================
create table if not exists public.women (
  id               uuid default uuid_generate_v4() primary key,
  household_id     uuid references public.households(id) on delete cascade not null,
  assessment_hh_id text not null,
  woman_line       integer not null,
  woman_id         text not null,
  ea_id            uuid references public.enumeration_areas(id) not null,
  interviewer_id   uuid references public.profiles(id) on delete restrict not null,
  status           text not null default 'draft'
                     check (status in ('draft', 'submitted', 'reviewed')),
  data             jsonb not null default '{}'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique (assessment_hh_id, woman_line)
);

create index if not exists idx_women_hh on public.women(assessment_hh_id);
create index if not exists idx_women_ea on public.women(ea_id);

-- ==============================================================================
-- 6. DEATHS (Level 2b — Household Death Screen & Roster)
-- ==============================================================================
create table if not exists public.deaths (
  id               uuid default uuid_generate_v4() primary key,
  household_id     uuid references public.households(id) on delete cascade not null,
  assessment_hh_id text not null,
  death_line       integer not null,
  ea_id            uuid references public.enumeration_areas(id) not null,
  interviewer_id   uuid references public.profiles(id) on delete restrict not null,
  linked_woman_line integer,
  status           text not null default 'draft'
                     check (status in ('draft', 'submitted', 'reviewed')),
  data             jsonb not null default '{}'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique (assessment_hh_id, death_line)
);

create index if not exists idx_deaths_hh on public.deaths(assessment_hh_id);

-- ==============================================================================
-- 7. PREGNANCIES (Level 3 — Pregnancy Episodes)
-- ==============================================================================
create table if not exists public.pregnancies (
  id               uuid default uuid_generate_v4() primary key,
  pregnancy_id     text unique not null,
  household_id     uuid references public.households(id) on delete cascade not null,
  assessment_hh_id text not null,
  woman_line       integer not null,
  episode_no       integer not null,
  ea_id            uuid references public.enumeration_areas(id) not null,
  interviewer_id   uuid references public.profiles(id) on delete restrict not null,
  status           text not null default 'draft'
                     check (status in ('draft', 'submitted', 'reviewed')),
  data             jsonb not null default '{}'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_pregnancies_hh    on public.pregnancies(assessment_hh_id);
create index if not exists idx_pregnancies_woman on public.pregnancies(assessment_hh_id, woman_line);

-- ==============================================================================
-- 8. BABIES (Level 4 — Baby Records)
-- ==============================================================================
create table if not exists public.babies (
  id               uuid default uuid_generate_v4() primary key,
  baby_id          integer not null,
  pregnancy_id     text references public.pregnancies(pregnancy_id) on delete cascade not null,
  assessment_hh_id text not null,
  woman_line       integer not null,
  episode_no       integer not null,
  ea_id            uuid references public.enumeration_areas(id) not null,
  interviewer_id   uuid references public.profiles(id) on delete restrict not null,
  status           text not null default 'draft'
                     check (status in ('draft', 'submitted', 'reviewed')),
  data             jsonb not null default '{}'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique (pregnancy_id, baby_id)
);

create index if not exists idx_babies_preg on public.babies(pregnancy_id);

-- Ensure status column exists if babies table was previously created
alter table public.babies
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'submitted', 'reviewed'));

-- ==============================================================================
-- 9. REVIEW FLAGS (Surveillance & Quality Flags)
-- ==============================================================================
create table if not exists public.review_flags (
  id               uuid default uuid_generate_v4() primary key,
  type             text not null,
  level            text not null
                     check (level in ('household', 'woman', 'death', 'pregnancy', 'baby')),
  record_ref       text not null,
  assessment_hh_id text not null,
  ea_id            uuid references public.enumeration_areas(id),
  interviewer_id   uuid references public.profiles(id),
  status           text not null default 'pending'
                     check (status in ('pending', 'resolved', 'dismissed')),
  severity         text not null default 'warning'
                     check (severity in ('info', 'warning', 'critical')),
  message          text not null,
  notes            text,
  resolved_by      uuid references public.profiles(id),
  resolved_at      timestamptz,
  created_at       timestamptz default now()
);

create index if not exists idx_flags_status on public.review_flags(status);
create index if not exists idx_flags_ea     on public.review_flags(ea_id);

-- ==============================================================================
-- 10. AUDIT LOG (Immutable trail — written only by triggers)
-- ==============================================================================
create table if not exists public.audit_log (
  id          uuid default uuid_generate_v4() primary key,
  table_name  text not null,
  record_id   text not null,
  action      text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  changed_by  uuid references public.profiles(id),
  old_values  jsonb,
  new_values  jsonb,
  notes       text,
  created_at  timestamptz default now()
);

create index if not exists idx_audit_record on public.audit_log(record_id);
create index if not exists idx_audit_table  on public.audit_log(table_name);

-- ==============================================================================
-- 11. HOUSEHOLD VISITS (Visit attempt history for A10/A11)
-- ==============================================================================
create table if not exists public.household_visits (
  id               uuid default uuid_generate_v4() primary key,
  household_id     uuid references public.households(id) on delete cascade,
  assessment_hh_id text not null,
  ea_id            uuid references public.enumeration_areas(id) not null,
  visit_number     integer not null,
  visit_result     integer not null,
  visited_at       timestamptz not null default now(),
  interviewer_id   uuid references public.profiles(id) on delete restrict not null,
  notes            text
);

create index if not exists idx_visits_hh on public.household_visits(assessment_hh_id);
create index if not exists idx_visits_ea on public.household_visits(ea_id);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) ACTIVATION
-- ==============================================================================
alter table public.profiles          enable row level security;
alter table public.enumeration_areas enable row level security;
alter table public.form_definitions  enable row level security;
alter table public.households        enable row level security;
alter table public.women             enable row level security;
alter table public.deaths            enable row level security;
alter table public.pregnancies       enable row level security;
alter table public.babies            enable row level security;
alter table public.review_flags      enable row level security;
alter table public.audit_log         enable row level security;
alter table public.household_visits  enable row level security;

-- ==============================================================================
-- HELPER FUNCTIONS (Security Definer with set search_path = public)
-- ==============================================================================

-- Drop old text overload of user_has_ea_access if present
drop function if exists public.user_has_ea_access(text);

-- Current user role helper
create or replace function public.current_user_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- UUID version of user_has_ea_access helper
create or replace function public.user_has_ea_access(p_ea_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from   public.profiles p
    join   public.enumeration_areas e on e.id = p_ea_id
    where  p.id = auth.uid()
      and  (
             p.role = 'admin'
          or e.code  = any(p.assigned_eas)
          or e.lga   = any(p.assigned_lgas)
           )
  );
$$;

-- ==============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- Each policy is preceded by DROP POLICY IF EXISTS for re-runnability.
-- ==============================================================================

-- ── 1. PROFILES ──────────────────────────────────────────────────────────────
drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Admins manage profiles" on public.profiles;

create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id or public.current_user_role() in ('admin', 'supervisor'));

create policy "Admins manage profiles" on public.profiles
  for all using (public.current_user_role() = 'admin');

-- ── 2. ENUMERATION AREAS ────────────────────────────────────────────────────
drop policy if exists "Authenticated users read EAs" on public.enumeration_areas;
drop policy if exists "Admins manage EAs"            on public.enumeration_areas;

create policy "Authenticated users read EAs" on public.enumeration_areas
  for select using (auth.role() = 'authenticated');

create policy "Admins manage EAs" on public.enumeration_areas
  for all using (public.current_user_role() = 'admin');

-- ── 3. FORM DEFINITIONS ─────────────────────────────────────────────────────
drop policy if exists "Authenticated users read form definitions" on public.form_definitions;
drop policy if exists "Admins manage form definitions"           on public.form_definitions;

create policy "Authenticated users read form definitions" on public.form_definitions
  for select using (auth.role() = 'authenticated');

create policy "Admins manage form definitions" on public.form_definitions
  for all using (public.current_user_role() = 'admin');

-- ── 4. HOUSEHOLDS ───────────────────────────────────────────────────────────
drop policy if exists "Admins full access to households"          on public.households;
drop policy if exists "Supervisors read assigned households"      on public.households;
drop policy if exists "Supervisors update reviewed households"    on public.households;
drop policy if exists "Interviewers select own households"        on public.households;
drop policy if exists "Interviewers view and edit own households" on public.households;
drop policy if exists "Interviewers insert own households"        on public.households;
drop policy if exists "Interviewers update own draft households"  on public.households;

-- Admin: full access
create policy "Admins full access to households" on public.households
  for all using (public.current_user_role() = 'admin');

-- Supervisors: select only where user_has_ea_access(ea_id)
create policy "Supervisors read assigned households" on public.households
  for select using (
    public.current_user_role() = 'supervisor'
    and public.user_has_ea_access(ea_id)
  );

-- Supervisors: update (to set status 'reviewed') only for those EAs
create policy "Supervisors update reviewed households" on public.households
  for update
  using (
    public.current_user_role() = 'supervisor'
    and public.user_has_ea_access(ea_id)
  )
  with check (
    public.current_user_role() = 'supervisor'
    and status = 'reviewed'
    and public.user_has_ea_access(ea_id)
  );

-- Interviewers: select own
create policy "Interviewers select own households" on public.households
  for select using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
  );

-- Interviewers: insert with check (interviewer_id = auth.uid() and user_has_ea_access(ea_id))
create policy "Interviewers insert own households" on public.households
  for insert with check (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
  );

-- Interviewers: update using (interviewer_id = auth.uid() and status = 'draft')
-- WITH CHECK (interviewer_id = auth.uid() and status in ('draft','submitted')). No delete.
create policy "Interviewers update own draft households" on public.households
  for update
  using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and status = 'draft'
  )
  with check (
    interviewer_id = auth.uid()
    and status in ('draft', 'submitted')
  );

-- ── 5. WOMEN ────────────────────────────────────────────────────────────────
drop policy if exists "Admins full access to women"      on public.women;
drop policy if exists "Supervisors read women"           on public.women;
drop policy if exists "Interviewers manage own women"    on public.women;
drop policy if exists "Interviewers select own women"    on public.women;
drop policy if exists "Interviewers insert own women"    on public.women;
drop policy if exists "Interviewers update own women"    on public.women;

create policy "Admins full access to women" on public.women
  for all using (public.current_user_role() = 'admin');

create policy "Supervisors read women" on public.women
  for select using (
    public.current_user_role() = 'supervisor'
    and public.user_has_ea_access(ea_id)
  );

create policy "Interviewers select own women" on public.women
  for select using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
  );

create policy "Interviewers insert own women" on public.women
  for insert with check (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
    and exists (
      select 1 from public.households h
      where h.id = household_id
        and h.interviewer_id = auth.uid()
        and h.status = 'draft'
    )
  );

create policy "Interviewers update own women" on public.women
  for update
  using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
    and exists (
      select 1 from public.households h
      where h.id = household_id
        and h.interviewer_id = auth.uid()
        and h.status = 'draft'
    )
  )
  with check (
    interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
    and exists (
      select 1 from public.households h
      where h.id = household_id
        and h.interviewer_id = auth.uid()
        and h.status = 'draft'
    )
  );

-- ── 6. DEATHS ───────────────────────────────────────────────────────────────
drop policy if exists "Admins full access to deaths"     on public.deaths;
drop policy if exists "Supervisors read deaths"          on public.deaths;
drop policy if exists "Interviewers manage own deaths"   on public.deaths;
drop policy if exists "Interviewers select own deaths"   on public.deaths;
drop policy if exists "Interviewers insert own deaths"   on public.deaths;
drop policy if exists "Interviewers update own deaths"   on public.deaths;

create policy "Admins full access to deaths" on public.deaths
  for all using (public.current_user_role() = 'admin');

create policy "Supervisors read deaths" on public.deaths
  for select using (
    public.current_user_role() = 'supervisor'
    and public.user_has_ea_access(ea_id)
  );

create policy "Interviewers select own deaths" on public.deaths
  for select using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
  );

create policy "Interviewers insert own deaths" on public.deaths
  for insert with check (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
    and exists (
      select 1 from public.households h
      where h.id = household_id
        and h.interviewer_id = auth.uid()
        and h.status = 'draft'
    )
  );

create policy "Interviewers update own deaths" on public.deaths
  for update
  using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
    and exists (
      select 1 from public.households h
      where h.id = household_id
        and h.interviewer_id = auth.uid()
        and h.status = 'draft'
    )
  )
  with check (
    interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
    and exists (
      select 1 from public.households h
      where h.id = household_id
        and h.interviewer_id = auth.uid()
        and h.status = 'draft'
    )
  );

-- ── 7. PREGNANCIES ──────────────────────────────────────────────────────────
drop policy if exists "Admins full access to pregnancies"     on public.pregnancies;
drop policy if exists "Supervisors read pregnancies"          on public.pregnancies;
drop policy if exists "Interviewers manage own pregnancies"   on public.pregnancies;
drop policy if exists "Interviewers select own pregnancies"   on public.pregnancies;
drop policy if exists "Interviewers insert own pregnancies"   on public.pregnancies;
drop policy if exists "Interviewers update own pregnancies"   on public.pregnancies;

create policy "Admins full access to pregnancies" on public.pregnancies
  for all using (public.current_user_role() = 'admin');

create policy "Supervisors read pregnancies" on public.pregnancies
  for select using (
    public.current_user_role() = 'supervisor'
    and public.user_has_ea_access(ea_id)
  );

create policy "Interviewers select own pregnancies" on public.pregnancies
  for select using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
  );

create policy "Interviewers insert own pregnancies" on public.pregnancies
  for insert with check (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
    and exists (
      select 1 from public.households h
      where h.id = household_id
        and h.interviewer_id = auth.uid()
        and h.status = 'draft'
    )
  );

create policy "Interviewers update own pregnancies" on public.pregnancies
  for update
  using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
    and exists (
      select 1 from public.households h
      where h.id = household_id
        and h.interviewer_id = auth.uid()
        and h.status = 'draft'
    )
  )
  with check (
    interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
    and exists (
      select 1 from public.households h
      where h.id = household_id
        and h.interviewer_id = auth.uid()
        and h.status = 'draft'
    )
  );

-- ── 8. BABIES ───────────────────────────────────────────────────────────────
drop policy if exists "Admins full access to babies"     on public.babies;
drop policy if exists "Supervisors read babies"          on public.babies;
drop policy if exists "Interviewers manage own babies"   on public.babies;
drop policy if exists "Interviewers select own babies"   on public.babies;
drop policy if exists "Interviewers insert own babies"   on public.babies;
drop policy if exists "Interviewers update own babies"   on public.babies;

create policy "Admins full access to babies" on public.babies
  for all using (public.current_user_role() = 'admin');

create policy "Supervisors read babies" on public.babies
  for select using (
    public.current_user_role() = 'supervisor'
    and public.user_has_ea_access(ea_id)
  );

create policy "Interviewers select own babies" on public.babies
  for select using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
  );

create policy "Interviewers insert own babies" on public.babies
  for insert with check (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
    and exists (
      select 1 from public.pregnancies pr
      join   public.households h on h.id = pr.household_id
      where  pr.pregnancy_id = babies.pregnancy_id
        and  h.interviewer_id = auth.uid()
        and  h.status = 'draft'
    )
  );

create policy "Interviewers update own babies" on public.babies
  for update
  using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
    and exists (
      select 1 from public.pregnancies pr
      join   public.households h on h.id = pr.household_id
      where  pr.pregnancy_id = babies.pregnancy_id
        and  h.interviewer_id = auth.uid()
        and  h.status = 'draft'
    )
  )
  with check (
    interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
    and exists (
      select 1 from public.pregnancies pr
      join   public.households h on h.id = pr.household_id
      where  pr.pregnancy_id = babies.pregnancy_id
        and  h.interviewer_id = auth.uid()
        and  h.status = 'draft'
    )
  );

-- ── 9. REVIEW FLAGS ─────────────────────────────────────────────────────────
drop policy if exists "Supervisors and admins manage review flags" on public.review_flags;
drop policy if exists "Interviewers view flags for own interviews" on public.review_flags;

create policy "Supervisors and admins manage review flags" on public.review_flags
  for all using (public.current_user_role() in ('admin', 'supervisor'));

create policy "Interviewers view flags for own interviews" on public.review_flags
  for select using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
  );

-- ── 10. AUDIT LOG ────────────────────────────────────────────────────────────
-- Only admins can select audit_log; nobody (not even admins) can update or delete it.
-- Writes are performed exclusively by SECURITY DEFINER trigger.
drop policy if exists "Admins view audit log"             on public.audit_log;
drop policy if exists "All authenticated insert audit log" on public.audit_log;

create policy "Admins view audit log" on public.audit_log
  for select using (public.current_user_role() = 'admin');

-- ── 11. HOUSEHOLD VISITS ─────────────────────────────────────────────────────
drop policy if exists "Admins full access to household visits"   on public.household_visits;
drop policy if exists "Supervisors read household visits"        on public.household_visits;
drop policy if exists "Interviewers select own household visits" on public.household_visits;
drop policy if exists "Interviewers insert own household visits" on public.household_visits;

create policy "Admins full access to household visits" on public.household_visits
  for all using (public.current_user_role() = 'admin');

create policy "Supervisors read household visits" on public.household_visits
  for select using (
    public.current_user_role() = 'supervisor'
    and public.user_has_ea_access(ea_id)
  );

create policy "Interviewers select own household visits" on public.household_visits
  for select using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
  );

create policy "Interviewers insert own household visits" on public.household_visits
  for insert with check (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
  );

-- ==============================================================================
-- TRIGGERS (Re-runnable via DROP TRIGGER IF EXISTS)
-- ==============================================================================

-- ── updated_at auto-maintenance trigger function ──────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_eas_updated_at on public.enumeration_areas;
create trigger trg_eas_updated_at
  before update on public.enumeration_areas
  for each row execute function public.set_updated_at();

drop trigger if exists trg_households_updated_at on public.households;
create trigger trg_households_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

drop trigger if exists trg_women_updated_at on public.women;
create trigger trg_women_updated_at
  before update on public.women
  for each row execute function public.set_updated_at();

drop trigger if exists trg_deaths_updated_at on public.deaths;
create trigger trg_deaths_updated_at
  before update on public.deaths
  for each row execute function public.set_updated_at();

drop trigger if exists trg_pregnancies_updated_at on public.pregnancies;
create trigger trg_pregnancies_updated_at
  before update on public.pregnancies
  for each row execute function public.set_updated_at();

drop trigger if exists trg_babies_updated_at on public.babies;
create trigger trg_babies_updated_at
  before update on public.babies
  for each row execute function public.set_updated_at();

-- ── Audit trigger function ────────────────────────────────────────────────────
-- Writes one row to audit_log on INSERT / UPDATE / DELETE for audited tables.
-- Runs as security definer (bypasses RLS) to record system changes accurately.
create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record_id text;
begin
  if tg_op = 'DELETE' then
    v_record_id := old.id::text;
  else
    v_record_id := new.id::text;
  end if;

  insert into public.audit_log (table_name, record_id, action, changed_by, old_values, new_values)
  values (
    tg_table_name,
    v_record_id,
    tg_op,
    auth.uid(),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

drop trigger if exists trg_audit_households on public.households;
create trigger trg_audit_households
  after insert or update or delete on public.households
  for each row execute function public.write_audit_log();

drop trigger if exists trg_audit_women on public.women;
create trigger trg_audit_women
  after insert or update or delete on public.women
  for each row execute function public.write_audit_log();

drop trigger if exists trg_audit_deaths on public.deaths;
create trigger trg_audit_deaths
  after insert or update or delete on public.deaths
  for each row execute function public.write_audit_log();

drop trigger if exists trg_audit_pregnancies on public.pregnancies;
create trigger trg_audit_pregnancies
  after insert or update or delete on public.pregnancies
  for each row execute function public.write_audit_log();

drop trigger if exists trg_audit_babies on public.babies;
create trigger trg_audit_babies
  after insert or update or delete on public.babies
  for each row execute function public.write_audit_log();

drop trigger if exists trg_audit_review_flags on public.review_flags;
create trigger trg_audit_review_flags
  after insert or update or delete on public.review_flags
  for each row execute function public.write_audit_log();

drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
  after insert or update or delete on public.profiles
  for each row execute function public.write_audit_log();

-- ==============================================================================
-- BOOTSTRAP SNIPPET — FIRST ADMIN ACCOUNT
-- ==============================================================================
-- Run after creating an admin user via Supabase Auth (Dashboard -> Authentication).
-- Replace 'admin@example.com' with the email of the administrator created in Auth:
--
--   insert into public.profiles (id, role, full_name, email, status)
--   select
--     u.id,
--     'admin',
--     coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
--     u.email,
--     'active'
--   from auth.users u
--   where lower(u.email) = lower('admin@example.com')
--   on conflict (id) do update set
--     role       = 'admin',
--     status     = 'active',
--     updated_at = now();
