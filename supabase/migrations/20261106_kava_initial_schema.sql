-- ==============================================================================
-- KaVa: KASSEP Household Survey Platform — Supabase Schema & RLS Policies
-- Doctors Medical Aid Foundation (DMAF) — Kano State, Nigeria
-- ------------------------------------------------------------------------------
-- Design principles:
--   • Re-runnable: all DDL uses IF NOT EXISTS / CREATE OR REPLACE / ALTER COLUMN.
--   • All policies are preceded by DROP POLICY IF EXISTS so the file can be run
--     on an existing database without manual cleanup.
--   • RLS is enforced at the row level for every data table.
--   • Audit writes are done by security-definer triggers, never by app code.
--   • No DELETE is permitted on survey data for interviewers (admin only).
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

-- ==============================================================================
-- 2. ENUMERATION AREAS
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
-- 3. FORM DEFINITIONS (versioned survey JSON)
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
-- Note: ON DELETE RESTRICT — cannot delete an EA while it has households.
--       interviewer_id is NOT NULL; removing SET NULL avoids the contradiction.
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
  pregnancy_id     text unique not null, -- format: assessment_hh_id-woman_line-episode_no
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
--    Added status column (same pattern as other levels).
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

-- ==============================================================================
-- 9. REVIEW FLAGS
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
-- 10. AUDIT LOG (written only by triggers; nobody can insert/update/delete)
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
-- 11. HOUSEHOLD VISITS (visit attempt history — supports A10/A11 coding)
-- ==============================================================================
create table if not exists public.household_visits (
  id               uuid default uuid_generate_v4() primary key,
  household_id     uuid references public.households(id) on delete cascade,
  assessment_hh_id text not null,
  ea_id            uuid references public.enumeration_areas(id) not null,
  visit_number     integer not null,
  visit_result     integer not null,          -- matches A10/A11 response codes
  visited_at       timestamptz not null default now(),
  interviewer_id   uuid references public.profiles(id) on delete restrict not null,
  notes            text
);

create index if not exists idx_visits_hh on public.household_visits(assessment_hh_id);
create index if not exists idx_visits_ea on public.household_visits(ea_id);

-- ==============================================================================
-- ROW-LEVEL SECURITY — enable on all tables
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
-- HELPER FUNCTIONS
-- ==============================================================================

-- Returns the current user's role from profiles (security definer so it always
-- reads the real role even when invoked inside a policy USING expression).
create or replace function public.current_user_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Returns true if the calling user may access the given EA (by its UUID).
-- Admins always pass. Supervisors pass when their assigned_lgas contains the
-- EA's LGA or their assigned_eas contains the EA's code. Interviewers pass
-- when their assigned_eas contains the EA's code.
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
-- RLS POLICIES
-- Convention: drop before create so this file is re-runnable.
-- ==============================================================================

-- ── PROFILES ─────────────────────────────────────────────────────────────────
drop policy if exists "Users read own profile"   on public.profiles;
drop policy if exists "Admins manage profiles"   on public.profiles;

create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id or public.current_user_role() in ('admin', 'supervisor'));

create policy "Admins manage profiles" on public.profiles
  for all using (public.current_user_role() = 'admin');

-- ── ENUMERATION AREAS ────────────────────────────────────────────────────────
drop policy if exists "Authenticated users read EAs" on public.enumeration_areas;
drop policy if exists "Admins manage EAs"            on public.enumeration_areas;

create policy "Authenticated users read EAs" on public.enumeration_areas
  for select using (auth.role() = 'authenticated');

create policy "Admins manage EAs" on public.enumeration_areas
  for all using (public.current_user_role() = 'admin');

-- ── FORM DEFINITIONS ─────────────────────────────────────────────────────────
drop policy if exists "Authenticated users read form definitions" on public.form_definitions;
drop policy if exists "Admins manage form definitions"           on public.form_definitions;

create policy "Authenticated users read form definitions" on public.form_definitions
  for select using (auth.role() = 'authenticated');

create policy "Admins manage form definitions" on public.form_definitions
  for all using (public.current_user_role() = 'admin');

-- ── HOUSEHOLDS ───────────────────────────────────────────────────────────────
drop policy if exists "Admins full access to households"          on public.households;
drop policy if exists "Supervisors read assigned households"      on public.households;
drop policy if exists "Supervisors update reviewed households"    on public.households;
drop policy if exists "Interviewers view and edit own households" on public.households;
drop policy if exists "Interviewers insert own households"        on public.households;
drop policy if exists "Interviewers update own draft households"  on public.households;

-- Admin: unrestricted
create policy "Admins full access to households" on public.households
  for all using (public.current_user_role() = 'admin');

-- Supervisor: select only their EAs; update only to set status = 'reviewed'
create policy "Supervisors read assigned households" on public.households
  for select using (
    public.current_user_role() = 'supervisor'
    and public.user_has_ea_access(ea_id)
  );

create policy "Supervisors update reviewed households" on public.households
  for update
  using (
    public.current_user_role() = 'supervisor'
    and public.user_has_ea_access(ea_id)
  )
  with check (
    public.current_user_role() = 'supervisor'
    and status = 'reviewed'
  );

-- Interviewer: own records only
create policy "Interviewers select own households" on public.households
  for select using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
  );

create policy "Interviewers insert own households" on public.households
  for insert with check (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and public.user_has_ea_access(ea_id)
  );

-- Can only update while status = 'draft'; result can be 'draft' or 'submitted'
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

-- ── WOMEN ────────────────────────────────────────────────────────────────────
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
    and exists (
      select 1 from public.households h
      where h.id = household_id
        and h.interviewer_id = auth.uid()
        and h.status = 'draft'
    )
  )
  with check (
    interviewer_id = auth.uid()
  );

-- ── DEATHS ───────────────────────────────────────────────────────────────────
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
    and exists (
      select 1 from public.households h
      where h.id = household_id
        and h.interviewer_id = auth.uid()
        and h.status = 'draft'
    )
  )
  with check (
    interviewer_id = auth.uid()
  );

-- ── PREGNANCIES ──────────────────────────────────────────────────────────────
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
    and exists (
      select 1 from public.households h
      where h.id = household_id
        and h.interviewer_id = auth.uid()
        and h.status = 'draft'
    )
  )
  with check (
    interviewer_id = auth.uid()
  );

-- ── BABIES ───────────────────────────────────────────────────────────────────
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
  );

-- ── REVIEW FLAGS ─────────────────────────────────────────────────────────────
drop policy if exists "Supervisors and admins manage review flags"    on public.review_flags;
drop policy if exists "Interviewers view flags for own interviews"    on public.review_flags;

create policy "Supervisors and admins manage review flags" on public.review_flags
  for all using (public.current_user_role() in ('admin', 'supervisor'));

create policy "Interviewers view flags for own interviews" on public.review_flags
  for select using (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
  );

-- ── AUDIT LOG ────────────────────────────────────────────────────────────────
-- Triggers write; nobody (not even admins) can INSERT/UPDATE/DELETE from app.
drop policy if exists "Admins view audit log"             on public.audit_log;
drop policy if exists "All authenticated insert audit log" on public.audit_log;

create policy "Admins view audit log" on public.audit_log
  for select using (public.current_user_role() = 'admin');

-- ── HOUSEHOLD VISITS ─────────────────────────────────────────────────────────
drop policy if exists "Admins full access to household visits"       on public.household_visits;
drop policy if exists "Supervisors read household visits"            on public.household_visits;
drop policy if exists "Interviewers select own household visits"     on public.household_visits;
drop policy if exists "Interviewers insert own household visits"     on public.household_visits;

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
-- TRIGGERS
-- ==============================================================================

-- ── updated_at auto-maintenance ───────────────────────────────────────────────
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

do $$ begin
  -- Create updated_at triggers for tables that have the column
  if not exists (select 1 from pg_trigger where tgname = 'trg_profiles_updated_at') then
    create trigger trg_profiles_updated_at
      before update on public.profiles
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_eas_updated_at') then
    create trigger trg_eas_updated_at
      before update on public.enumeration_areas
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_households_updated_at') then
    create trigger trg_households_updated_at
      before update on public.households
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_women_updated_at') then
    create trigger trg_women_updated_at
      before update on public.women
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_deaths_updated_at') then
    create trigger trg_deaths_updated_at
      before update on public.deaths
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_pregnancies_updated_at') then
    create trigger trg_pregnancies_updated_at
      before update on public.pregnancies
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_babies_updated_at') then
    create trigger trg_babies_updated_at
      before update on public.babies
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- ── Audit trigger function ────────────────────────────────────────────────────
-- Writes one row to audit_log on INSERT / UPDATE / DELETE.
-- Runs as security definer (bypasses RLS on audit_log) so the trigger can
-- always write regardless of who triggered the change.
create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record_id text;
begin
  -- Derive a stable record identifier from the mutated row
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

do $$ begin
  -- Attach audit triggers to every survey table
  if not exists (select 1 from pg_trigger where tgname = 'trg_audit_households') then
    create trigger trg_audit_households
      after insert or update or delete on public.households
      for each row execute function public.write_audit_log();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_audit_women') then
    create trigger trg_audit_women
      after insert or update or delete on public.women
      for each row execute function public.write_audit_log();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_audit_deaths') then
    create trigger trg_audit_deaths
      after insert or update or delete on public.deaths
      for each row execute function public.write_audit_log();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_audit_pregnancies') then
    create trigger trg_audit_pregnancies
      after insert or update or delete on public.pregnancies
      for each row execute function public.write_audit_log();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_audit_babies') then
    create trigger trg_audit_babies
      after insert or update or delete on public.babies
      for each row execute function public.write_audit_log();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_audit_review_flags') then
    create trigger trg_audit_review_flags
      after insert or update or delete on public.review_flags
      for each row execute function public.write_audit_log();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_audit_profiles') then
    create trigger trg_audit_profiles
      after insert or update or delete on public.profiles
      for each row execute function public.write_audit_log();
  end if;
end $$;

-- ==============================================================================
-- BOOTSTRAP — create the first admin profile for an existing auth user
-- ==============================================================================
-- Run this snippet ONCE after creating the first user via Supabase Auth dashboard
-- or the invite email. Replace the UUID with the user's actual auth.users.id.
--
--   insert into public.profiles (id, role, full_name, email, status)
--   values (
--     '<auth-user-uuid>',         -- from auth.users table
--     'admin',
--     'Dr. Amina Sabu',
--     'coordinator@dmaf-kassep.org',
--     'active'
--   )
--   on conflict (id) do update
--     set role      = excluded.role,
--         full_name = excluded.full_name,
--         status    = excluded.status;
