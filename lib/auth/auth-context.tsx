"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types/auth';
import { Language, UI_TRANSLATIONS } from '@/lib/i18n/translations';

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  language: Language;
  setRole: (role: UserRole) => void;
  setLanguage: (lang: Language) => void;
  setUser: (user: UserProfile) => void;
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
    assignedEas: ['All ~140 EAs']
  },
  supervisor: {
    id: 'sup-01',
    role: 'supervisor',
    fullName: 'Dr. Fatima Umar (Field Supervisor)',
    email: 'fatima.umar@dmaf-kassep.org',
    phone: '0800 000 0002',
    assignedLgas: ['Kano Municipal', 'Dala', 'Kumbotso'],
    assignedEas: ['KAN-MUN-001', 'KAN-MUN-002', 'KAN-MUN-003', 'KAN-DAL-001', 'KAN-DAL-002', 'KAN-KUM-001', 'KAN-KUM-002']
  },
  interviewer: {
    id: 'int-01',
    role: 'interviewer',
    fullName: 'Ibrahim Bello (Field Interviewer)',
    email: 'ibrahim.bello@dmaf-kassep.org',
    phone: '0800 000 0003',
    assignedLgas: ['Kano Municipal', 'Tarauni'],
    assignedEas: ['KAN-MUN-001', 'KAN-MUN-002', 'KAN-TAR-002']
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('supervisor');
  const [user, setUser] = useState<UserProfile>(DEFAULT_USERS.supervisor);
  const [language, setLanguage] = useState<Language>('en');

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    setUser(DEFAULT_USERS[newRole]);
  };

  const t = UI_TRANSLATIONS[language];

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        language,
        setRole,
        setLanguage,
        setUser,
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

