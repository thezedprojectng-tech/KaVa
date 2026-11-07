import { UserProfile, EnumerationArea } from '@/types/auth';

/**
 * Checks if a user has access to a specific Enumeration Area.
 * Enforces the database RLS rules from 20261107_rls_patch.sql:
 * - Inactive users have NO access.
 * - Admins have access to all EAs.
 * - Supervisors have access to EAs in their assigned LGAs or assigned EAs.
 * - Interviewers have access ONLY to their explicitly assigned EA codes (profiles.assigned_eas).
 */
export function userHasEaAccess(
  user: Pick<UserProfile, 'role' | 'assignedLgas' | 'assignedEas' | 'status'>,
  ea: Pick<EnumerationArea, 'code' | 'lga'>
): boolean {
  if (user.status === 'inactive') {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  const assignedEas = user.assignedEas || [];

  if (user.role === 'supervisor') {
    const assignedLgas = user.assignedLgas || [];
    if (assignedLgas.includes('All LGAs')) {
      return true;
    }
    return assignedLgas.includes(ea.lga) || assignedEas.includes(ea.code);
  }

  if (user.role === 'interviewer') {
    // Strictly by assigned EA codes only
    return assignedEas.includes(ea.code);
  }

  return false;
}

