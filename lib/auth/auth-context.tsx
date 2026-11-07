"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '@/types/auth';
import { Language, UI_TRANSLATIONS } from '@/lib/i18n/translations';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { kavaDb } from '@/lib/db/dexie';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  language: Language;
  isDeactivated: boolean;
  setRole: (role: UserRole) => void;
  setLanguage: (lang: Language) => void;
  setUser: (user: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  signOut: () => Promise<void>;
  checkProfileStatus: () => Promise<boolean>;
  t: typeof UI_TRANSLATIONS.en;
}

const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  admin: {
    id: 'usr-admin-01',
    role: 'admin',
    fullName: 'Dr. Amina Sabu (Study Coordinator)',
    email: 'coordinator@dmaf-kassep.org',
    phone: '0800 000 0001',
    assignedLgas: ['All LGAs'],
    assignedEas: ['All ~140 EAs'],
    status: 'active'
  },
  supervisor: {
    id: 'sup-01',
    role: 'supervisor',
    fullName: 'Dr. Fatima Umar (Field Supervisor)',
    email: 'fatima.umar@dmaf-kassep.org',
    phone: '0800 000 0002',
    assignedLgas: ['Kano Municipal', 'Dala', 'Kumbotso'],
    assignedEas: ['KAN-MUN-001', 'KAN-MUN-002', 'KAN-MUN-003', 'KAN-DAL-001', 'KAN-DAL-002', 'KAN-KUM-001', 'KAN-KUM-002'],
    status: 'active'
  },
  interviewer: {
    id: 'int-01',
    role: 'interviewer',
    fullName: 'Ibrahim Bello (Field Interviewer)',
    email: 'ibrahim.bello@dmaf-kassep.org',
    phone: '0800 000 0003',
    assignedLgas: ['Kano Municipal', 'Tarauni'],
    assignedEas: ['KAN-MUN-001', 'KAN-MUN-002', 'KAN-TAR-002'],
    status: 'active'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('supervisor');
  const [user, setUser] = useState<UserProfile>(DEFAULT_USERS.supervisor);
  const [language, setLanguage] = useState<Language>('en');
  const [isDeactivated, setIsDeactivated] = useState<boolean>(false);

  const t = UI_TRANSLATIONS[language];

  // Sign out helper
  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
  }, []);

  // Check profile status against Supabase / Dexie
  const checkProfileStatus = useCallback(async (): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            if (profile.status === 'inactive') {
              await signOut();
              setIsDeactivated(true);
              return false;
            } else {
              setUser({
                id: profile.id,
                role: profile.role,
                fullName: profile.full_name || session.user.email?.split('@')[0] || 'Field Staff',
                email: profile.email || session.user.email || '',
                phone: profile.phone || '',
                assignedLgas: profile.assigned_lgas || [],
                assignedEas: profile.assigned_eas || [],
                status: 'active',
                createdAt: profile.created_at
              });
              setRoleState(profile.role);
              setIsDeactivated(false);
              return true;
            }
          }
        }
      } catch (e) {
        console.warn('Profile status check failed:', e);
      }
    }

    // Check local database profile cache
    try {
      const localProfile = await kavaDb.profiles.get(user.id);
      if (localProfile && localProfile.status === 'inactive') {
        await signOut();
        setIsDeactivated(true);
        return false;
      }
    } catch {
      // Ignore local read errors
    }

    if (user.status === 'inactive') {
      await signOut();
      setIsDeactivated(true);
      return false;
    }

    return true;
  }, [user.id, user.status, signOut]);

  // Initial session & status verification
  useEffect(() => {
    checkProfileStatus();

    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await checkProfileStatus();
        } else if (event === 'SIGNED_OUT') {
          // If deactivated, remain deactivated; otherwise revert to default supervisor
          if (!isDeactivated) {
            setUser(DEFAULT_USERS.supervisor);
            setRoleState('supervisor');
          }
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [checkProfileStatus, isDeactivated]);

  // Watch user.status changes directly
  useEffect(() => {
    if (user.status === 'inactive') {
      setIsDeactivated(true);
      signOut();
    }
  }, [user.status, signOut]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    setUser(DEFAULT_USERS[newRole]);
    setIsDeactivated(false);
  };

  // If user is deactivated, immediately render blocked UI
  if (isDeactivated || user.status === 'inactive') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <main className="max-w-md w-full bg-card border border-destructive/30 rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col items-center">
          <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <ShieldAlert className="size-8" />
          </div>

          <h1 className="text-xl font-bold text-foreground mb-2">
            {language === 'ha' ? 'An Dakatar da Asusunka' : 'Account Deactivated'}
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
            {language === 'ha'
              ? 'Mai gudanarwa ya dakatar da wannan asusun bincike. An fitar da ku daga manhajar kuma an toshe shiga.'
              : 'Your account has been deactivated by a Study Administrator. You have been signed out and further survey access has been blocked.'}
          </p>

          <div className="w-full p-3 rounded-lg bg-muted/60 text-xs font-mono text-muted-foreground mb-6 text-left border border-border space-y-1">
            <div><span className="text-foreground font-semibold">User:</span> {user.fullName} ({user.email})</div>
            <div><span className="text-foreground font-semibold">Role:</span> {user.role}</div>
            <div><span className="text-foreground font-semibold">Status:</span> <span className="text-destructive font-semibold uppercase">inactive</span></div>
          </div>

          <div className="w-full space-y-2">
            <Button
              variant="outline"
              className="w-full gap-2 text-xs font-medium border-border"
              onClick={async () => {
                await signOut();
                setIsDeactivated(false);
                setRoleState('supervisor');
                setUser(DEFAULT_USERS.supervisor);
              }}
            >
              <LogOut className="size-3.5" />
              <span>{language === 'ha' ? 'Koma Shiga (Operator)' : 'Switch Operator / Return'}</span>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        language,
        isDeactivated,
        setRole,
        setLanguage,
        setUser,
        signOut,
        checkProfileStatus,
        t
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
