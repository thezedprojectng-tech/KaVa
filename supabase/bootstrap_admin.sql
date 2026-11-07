-- ==============================================================================
-- KaVa: Bootstrap Administrator Account
-- Doctors Medical Aid Foundation (DMAF) — Kano State, Nigeria
-- ==============================================================================
-- 1. First, create your user in Supabase Dashboard:
--    Authentication -> Users -> 'Add user' (e.g. your real work/org email)
--
-- 2. Then run this query in SQL Editor, replacing 'admin@example.com' with that email:

insert into public.profiles (
  id,
  role,
  full_name,
  email,
  status
)
select
  u.id,
  'admin',
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.email,
  'active'
from auth.users u
where lower(u.email) = lower('admin@example.com') -- <-- Put the admin's email here
on conflict (id) do update set
  role       = 'admin',
  status     = 'active',
  updated_at = now();

-- Verify the admin profile was created successfully
select id, role, full_name, email, status, created_at
from public.profiles
where role = 'admin';
