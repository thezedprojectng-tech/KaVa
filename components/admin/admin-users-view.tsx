"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, UserRole, EnumerationArea } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Shield,
  Lock,
  Sparkles,
  UserPlus,
  Edit2,
  CheckSquare,
  Search,
  X,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Power,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { surveySyncService } from '@/lib/db/sync';
import { cn } from '@/lib/utils';

interface AdminUsersViewProps {
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  language: 'en' | 'ha';
}

const KANO_LGAS = [
  'Kano Municipal',
  'Dala',
  'Fagge',
  'Gwale',
  'Tarauni',
  'Nassarawa',
  'Kumbotso',
  'Ungogo',
  'Bichi',
  'Rano'
];

export function AdminUsersView({
  currentRole,
  onSwitchRole,
  language
}: AdminUsersViewProps) {
  const isHausa = language === 'ha';
  const isAdmin = currentRole === 'admin';
  const isSupervisor = currentRole === 'supervisor';
  const isInterviewer = currentRole === 'interviewer';

  const { user } = useAuth();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [allEas, setAllEas] = useState<EnumerationArea[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserProfile | null>(null);

  // Form Fields for Add User
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('interviewer');
  const [newPassword, setNewPassword] = useState('');
  const [newAssignedLgas, setNewAssignedLgas] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Form Fields
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('interviewer');
  const [editLoading, setEditLoading] = useState(false);

  // EA Assignment Dialog Search & Selection
  const [eaSearch, setEaSearch] = useState('');
  const [selectedEaCodes, setSelectedEaCodes] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Load profiles from DB / API
  const loadUsersAndEas = async () => {
    setLoading(true);
    try {
      const [profiles, eas] = await Promise.all([
        surveySyncService.getProfiles(),
        surveySyncService.getEnumerationAreas()
      ]);
      setStaffList(profiles);
      setAllEas(eas);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersAndEas();
  }, []);

  // Filter staff by supervisor's assigned LGAs if supervisor
  const visibleStaff = useMemo(() => {
    if (isAdmin) return staffList;
    if (isSupervisor) {
      const supervisorLgas = user.assignedLgas || [];
      if (supervisorLgas.includes('All LGAs') || supervisorLgas.length === 0) {
        return staffList;
      }
      return staffList.filter((s) =>
        s.assignedLgas.some((lga) => supervisorLgas.includes(lga)) || s.id === user.id
      );
    }
    return [];
  }, [staffList, isAdmin, isSupervisor, user]);

  // Handle Add User Submit
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newFullName.trim() || !newEmail.trim()) {
      setFormError('Please provide both Full Name and Email.');
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newFullName.trim(),
          email: newEmail.trim().toLowerCase(),
          phone: newPhone.trim() || undefined,
          role: newRole,
          password: newPassword.trim() || undefined,
          assignedLgas: newAssignedLgas,
          assignedEas: []
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      const createdUser: UserProfile = data.user;
      await surveySyncService.upsertProfile(createdUser);
      setStaffList((prev) => [createdUser, ...prev.filter((p) => p.id !== createdUser.id)]);

      // Reset Form
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewRole('interviewer');
      setNewPassword('');
      setNewAssignedLgas([]);
      setIsAddUserOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error creating user');
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Edit User Submit
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditLoading(true);
    try {
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          fullName: editFullName.trim(),
          phone: editPhone.trim() || undefined,
          role: editRole
        })
      });

      const updated: UserProfile = {
        ...editingUser,
        fullName: editFullName.trim(),
        phone: editPhone.trim() || undefined,
        role: editRole
      };

      await surveySyncService.upsertProfile(updated);
      setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to edit user:', err);
    } finally {
      setEditLoading(false);
    }
  };

  // Open Edit User Modal
  const openEditModal = (staff: UserProfile) => {
    setEditingUser(staff);
    setEditFullName(staff.fullName);
    setEditPhone(staff.phone || '');
    setEditRole(staff.role);
  };

  // Open Assign EAs Modal
  const openAssignModal = (staff: UserProfile) => {
    setAssigningUser(staff);
    setSelectedEaCodes(staff.assignedEas || []);
    setEaSearch('');
  };

  // Toggle EA selection in assign dialog
  const toggleEaSelection = (code: string) => {
    setSelectedEaCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Save EA Assignments
  const handleSaveAssignments = async () => {
    if (!assigningUser) return;
    setAssignLoading(true);

    try {
      // Derive assigned LGAs from selected EAs
      const relevantEas = allEas.filter((ea) => selectedEaCodes.includes(ea.code));
      const derivedLgas = Array.from(new Set(relevantEas.map((ea) => ea.lga)));

      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assigningUser.id,
          assignedEas: selectedEaCodes,
          assignedLgas: derivedLgas
        })
      });

      await surveySyncService.updateProfileAssignments(
        assigningUser.id,
        selectedEaCodes,
        derivedLgas
      );

      setStaffList((prev) =>
        prev.map((s) =>
          s.id === assigningUser.id
            ? { ...s, assignedEas: selectedEaCodes, assignedLgas: derivedLgas }
            : s
        )
      );

      setAssigningUser(null);
    } catch (err) {
      console.error('Failed to save assignments:', err);
    } finally {
      setAssignLoading(false);
    }
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (staff: UserProfile) => {
    if (!isAdmin) return;
    const newStatus: 'active' | 'inactive' = staff.status === 'inactive' ? 'active' : 'inactive';

    try {
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: staff.id,
          status: newStatus
        })
      });

      await surveySyncService.updateProfileStatus(staff.id, newStatus);
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, status: newStatus } : s))
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Interviewers access blocked
  if (isInterviewer) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto my-12 bg-card border border-border rounded-xl shadow-xs">
        <div className="p-3 rounded-full bg-destructive/10 text-destructive mb-3">
          <ShieldAlert className="size-8" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-1">
          {isHausa ? 'Babu Izinin Shiga' : 'Access Restricted'}
        </h2>
        <p className="text-xs text-muted-foreground font-mono leading-relaxed">
          {isHausa
            ? 'Masu gudanarwa (Admin) da Masu kulawa (Supervisors) ne kadai ke da izinin ganin ko canza rukunin ma\'aikata da yankunan bincike.'
            : 'User Management & EA Assignments are reserved for Study Administrators and Field Supervisors. Field Interviewers can only access their assigned interviews.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Users className="size-4 text-primary" />
              {isHausa ? 'Gudanar da Ma\'aikata da Yankuna' : 'User Roles & Enumeration Area Assignments'}
            </h2>
            {isDemo && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono">
                <Sparkles className="size-3" />
                Demo mode
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isSupervisor
              ? 'Supervisor View: Staff and EA workload assigned within your supervisory LGAs.'
              : 'Admin RBAC: Manage user accounts, assign ~140 EAs across 10 Kano LGAs, and control activation status.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Add User Button (Admin only) */}
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => {
                setFormError(null);
                setIsAddUserOpen(true);
              }}
              className="gap-1.5 text-xs font-medium"
            >
              <UserPlus className="size-3.5" />
              <span>{isHausa ? 'Sanya Sabon Ma\'aikaci' : 'Add user'}</span>
            </Button>
          )}

          {/* Role Switcher Demo Box (ONLY shown when NEXT_PUBLIC_DEMO_MODE is true) */}
          {isDemo && (
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted border border-border">
              <span className="text-[10px] text-muted-foreground font-medium pl-1">Role:</span>
              {(['admin', 'supervisor', 'interviewer'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => onSwitchRole(r)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-all',
                    currentRole === r
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Staff Table / Empty State */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-muted-foreground">
            Loading team profiles...
          </div>
        ) : visibleStaff.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="p-3 rounded-full bg-muted text-muted-foreground mb-3">
              <Users className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {isHausa ? 'Babu ma\'aikata a yanzu' : 'No staff yet'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-4">
              {isHausa
                ? 'Ba a sanya masu bincike ko masu kulawa ba tukuna. Latsa maɓallin da ke ƙasa domin ƙara ma\'aikaci na farko.'
                : 'No field staff have been enrolled yet. Add field supervisors and interviewers to assign Enumeration Areas across Kano State.'}
            </p>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setIsAddUserOpen(true)}
                className="gap-1.5 text-xs"
              >
                <UserPlus className="size-3.5" />
                <span>{isHausa ? 'Ƙara Ma\'aikaci' : 'Add user'}</span>
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-mono text-xs">Staff Name</TableHead>
                <TableHead className="font-mono text-xs">Role</TableHead>
                <TableHead className="font-mono text-xs">Status</TableHead>
                <TableHead className="font-mono text-xs">Email</TableHead>
                <TableHead className="font-mono text-xs">Phone</TableHead>
                <TableHead className="font-mono text-xs">Assigned LGAs</TableHead>
                <TableHead className="font-mono text-xs">Assigned EAs</TableHead>
                <TableHead className="font-mono text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleStaff.map((staff) => {
                const isInactive = staff.status === 'inactive';
                return (
                  <TableRow
                    key={staff.id}
                    className={cn('hover:bg-muted/40 transition-colors', isInactive && 'opacity-60 bg-muted/20')}
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{staff.fullName}</span>
                        {staff.id === user.id && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-primary/10 text-primary">
                            You
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium font-mono uppercase border',
                          staff.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
                            : staff.role === 'supervisor'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        )}
                      >
                        {staff.role}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border',
                          isInactive
                            ? 'bg-muted text-muted-foreground border-border'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        )}
                      >
                        <span className={cn('size-1.5 rounded-full', isInactive ? 'bg-muted-foreground' : 'bg-emerald-500')} />
                        {staff.status || 'active'}
                      </span>
                    </TableCell>

                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {staff.email}
                    </TableCell>

                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {staff.phone || '—'}
                    </TableCell>

                    <TableCell className="text-foreground text-xs">
                      {staff.assignedLgas?.length > 0 ? staff.assignedLgas.join(', ') : 'None'}
                    </TableCell>

                    <TableCell className="text-primary font-mono text-[11px] max-w-xs truncate">
                      {staff.assignedEas?.length > 0 ? (
                        <span>
                          {staff.assignedEas.slice(0, 3).join(', ')}
                          {staff.assignedEas.length > 3 ? ` +${staff.assignedEas.length - 3} more` : ''}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">None assigned</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAssignModal(staff)}
                            className="h-7 text-xs font-mono px-2"
                            title="Assign EAs"
                          >
                            <CheckSquare className="size-3 text-primary mr-1" />
                            Assign EAs
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(staff)}
                            className="h-7 text-xs px-2"
                            title="Edit User"
                          >
                            <Edit2 className="size-3 text-muted-foreground mr-1" />
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(staff)}
                            className={cn(
                              'h-7 text-xs px-1.5',
                              isInactive ? 'text-emerald-600 hover:text-emerald-700' : 'text-muted-foreground hover:text-destructive'
                            )}
                            title={isInactive ? 'Reactivate User' : 'Deactivate User'}
                          >
                            <Power className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px] inline-flex items-center gap-1 font-mono">
                          <Lock className="size-3" /> Read Only
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DIALOG 1: Add User Modal (Admin only)                                     */}
      {/* ========================================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <UserPlus className="size-4 text-primary" />
                Add New Staff Member
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Maryam Aliyu"
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Email Address <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. maryam.aliyu@dmaf-kassep.org"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-foreground mb-1">Phone Number</label>
                  <Input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0800 000 0000"
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">
                    System Role <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="h-8 w-full px-2 rounded-md bg-muted/50 border border-border text-xs focus:outline-none"
                  >
                    <option value="interviewer">Interviewer</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Temporary Password / Invite Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank for auto-generated password"
                  className="h-8 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">
                  User accounts are provisioned server-side using Supabase Auth.
                </span>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Assigned LGAs</label>
                <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-muted/40 border border-border max-h-28 overflow-y-auto">
                  {KANO_LGAS.map((lga) => {
                    const isChecked = newAssignedLgas.includes(lga);
                    return (
                      <label key={lga} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setNewAssignedLgas((prev) =>
                              prev.includes(lga) ? prev.filter((l) => l !== lga) : [...prev, lga]
                            );
                          }}
                          className="size-3 rounded border-border"
                        />
                        <span className="truncate">{lga}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={addLoading}>
                  {addLoading ? 'Creating User...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 2: Edit User Modal (Admin only)                                    */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Edit2 className="size-4 text-primary" />
                Edit Staff Member
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Full Name</label>
                <Input
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Email</label>
                <Input
                  disabled
                  value={editingUser.email}
                  className="h-8 text-xs font-mono bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-foreground mb-1">Phone Number</label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="h-8 w-full px-2 rounded-md bg-muted/50 border border-border text-xs focus:outline-none"
                  >
                    <option value="interviewer">Interviewer</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 3: Assign EAs Multi-Select Modal                                   */}
      {/* ========================================================================= */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckSquare className="size-4 text-primary" />
                  Assign Enumeration Areas (EAs)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Assigning to: <span className="font-semibold text-foreground">{assigningUser.fullName}</span> ({assigningUser.role})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningUser(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={eaSearch}
                onChange={(e) => setEaSearch(e.target.value)}
                placeholder="Search by EA code, ward, or LGA..."
                className="h-8 pl-8 text-xs font-mono"
              />
            </div>

            <div className="text-[11px] font-mono text-muted-foreground flex justify-between items-center">
              <span>{selectedEaCodes.length} EAs selected</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEaCodes(allEas.map((e) => e.code))}
                  className="hover:text-primary transition-colors"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setSelectedEaCodes([])}
                  className="hover:text-destructive transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* EA Checklist */}
            <div className="border border-border rounded-lg max-h-64 overflow-y-auto divide-y divide-border/60">
              {allEas
                .filter((ea) => {
                  const q = eaSearch.toLowerCase();
                  return (
                    ea.code.toLowerCase().includes(q) ||
                    ea.name.toLowerCase().includes(q) ||
                    ea.lga.toLowerCase().includes(q) ||
                    ea.ward.toLowerCase().includes(q)
                  );
                })
                .map((ea) => {
                  const isChecked = selectedEaCodes.includes(ea.code);
                  return (
                    <label
                      key={ea.id}
                      className={cn(
                        'flex items-center justify-between p-2.5 hover:bg-muted/40 cursor-pointer text-xs transition-colors',
                        isChecked && 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEaSelection(ea.code)}
                          className="size-3.5 rounded border-border"
                        />
                        <div className="truncate">
                          <span className="font-mono font-semibold text-foreground mr-2">
                            {ea.code}
                          </span>
                          <span className="text-muted-foreground">{ea.name}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0 ml-2">
                        {ea.ward}, {ea.lga}
                      </span>
                    </label>
                  );
                })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAssigningUser(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveAssignments}
                disabled={assignLoading}
              >
                {assignLoading ? 'Saving...' : 'Save Assignments'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
