-- 1. Inactive users lose access
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and status = 'active';
$$;

-- 2. EA access: admin = all; supervisor = assigned LGAs or EAs; interviewer = assigned EAs only
create or replace function public.user_has_ea_access(p_ea_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles p
    join public.enumeration_areas e on e.id = p_ea_id
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'admin'
        or e.code = any(p.assigned_eas)
        or (p.role = 'supervisor' and e.lga = any(p.assigned_lgas))
      )
  );
$$;

-- 3. Households must start as draft (children are only writable while the parent is draft)
drop policy if exists "Interviewers insert own households" on public.households;
create policy "Interviewers insert own households" on public.households
  for insert with check (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and status = 'draft'
    and public.user_has_ea_access(ea_id)
  );

-- 4. Review flags: scoped supervisors, interviewers can raise their own pending flags
drop policy if exists "Supervisors and admins manage review flags" on public.review_flags;
drop policy if exists "Admins manage review flags" on public.review_flags;
drop policy if exists "Supervisors manage review flags in their areas" on public.review_flags;
drop policy if exists "Interviewers create own pending flags" on public.review_flags;

create policy "Admins manage review flags" on public.review_flags
  for all using (public.current_user_role() = 'admin');

create policy "Supervisors manage review flags in their areas" on public.review_flags
  for all
  using (public.current_user_role() = 'supervisor' and ea_id is not null and public.user_has_ea_access(ea_id))
  with check (public.current_user_role() = 'supervisor' and ea_id is not null and public.user_has_ea_access(ea_id));

create policy "Interviewers create own pending flags" on public.review_flags
  for insert with check (
    public.current_user_role() = 'interviewer'
    and interviewer_id = auth.uid()
    and status = 'pending'
    and ea_id is not null
    and public.user_has_ea_access(ea_id)
  );

-- 5. Audit log: skip draft-to-draft autosave updates
create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_record_id text;
begin
  if tg_op = 'UPDATE'
     and to_jsonb(old)->>'status' = 'draft'
     and to_jsonb(new)->>'status' = 'draft' then
    return new;
  end if;

  if tg_op = 'DELETE' then v_record_id := old.id::text; else v_record_id := new.id::text; end if;

  insert into public.audit_log (table_name, record_id, action, changed_by, old_values, new_values)
  values (tg_table_name, v_record_id, tg_op, auth.uid(),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;