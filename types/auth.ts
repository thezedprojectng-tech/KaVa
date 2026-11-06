export type UserRole = 'admin' | 'supervisor' | 'interviewer';

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone?: string;
  assignedLgas: string[];
  assignedEas: string[];
  status?: 'active' | 'inactive';
  createdAt?: string;
}

export interface EnumerationArea {
  id: string;
  code: string;
  name: string;
  lga: string;
  ward: string;
  segment: string;
  latitude: number;
  longitude: number;
  targetHouseholds: number;
  completedHouseholds: number;
  inProgressHouseholds: number;
  status: 'not_started' | 'in_progress' | 'completed';
  supervisorId?: string;
  supervisorName?: string;
  interviewerId?: string;
  interviewerName?: string;
  notes?: string;
  updatedAt: string;
}

