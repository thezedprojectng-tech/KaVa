-- ==============================================================================
-- KaVa: Bootstrap First Administrator Account
-- Doctors Medical Aid Foundation (DMAF) â€” Kano State, Nigeria
-- ==============================================================================
-- Run this in the Supabase Dashboard SQL Editor to grant admin access
-- or bootstrap the primary study coordinator account.

-- 1. Create the user in auth.users if not already created via Auth UI
-- Note: Replace 'your-coordinator-uuid-here' with the actual auth.users id
-- generated in Supabase Dashboard -> Authentication -> Users -> 'Add user'

-- Example bootstrap profile insertion:
insert into public.profiles (
  id,
  role,
  full_name,
  email,
  phone,
  assigned_lgas,
  assigned_eas,
  status,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000001', -- Replace with your auth.users.id
  'admin',
  'Dr. Amina Sabu (Study Coordinator)',
  'coordinator@dmaf-kassep.org',
  '0800 000 0001',
  array[
    'Kano Municipal', 'Dala', 'Fagge', 'Gwale', 'Tarauni',
    'Nassarawa', 'Kumbotso', 'Ungogo', 'Bichi', 'Rano'
  ],
  array['All ~140 EAs'],
  'active',
  now(),
  now()
)
on conflict (id) do update set
  role = 'admin',
  full_name = excluded.full_name,
  email = excluded.email,
  status = 'active',
  updated_at = now();

-- Verify profile:
select id, role, full_name, email, status from public.profiles where role = 'admin';

