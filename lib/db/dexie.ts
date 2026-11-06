import Dexie, { Table } from 'dexie';
import {
  HouseholdRecord,
  WomanRecord,
  DeathRecord,
  PregnancyRecord,
  BabyRecord,
  ReviewFlag,
  AuditLogEntry
} from '@/types/survey';
import { EnumerationArea, UserProfile } from '@/types/auth';

export interface ActiveDraft {
  assessment_hh_id: string;
  ea_id: string;
  interviewer_id: string;
  currentStep: number;
  currentSection: string;
  activeWomanIndex: number;
  activePregnancyIndex: number;
  activeBabyIndex: number;
  householdData: Record<string, any>;
  womenData: Array<{ woman_line: number; data: Record<string, any> }>;
  deathsData: Array<{ death_line: number; data: Record<string, any> }>;
  pregnanciesData: Array<{
    pregnancy_id: string;
    woman_line: number;
    episode_no: number;
    data: Record<string, any>;
  }>;
  babiesData: Array<{
    baby_id: number;
    pregnancy_id: string;
    woman_line: number;
    episode_no: number;
    data: Record<string, any>;
  }>;
  lastUpdated: string;
}

export class KaVaDatabase extends Dexie {
  households!: Table<HouseholdRecord, string>;
  women!: Table<WomanRecord, string>;
  deaths!: Table<DeathRecord, string>;
  pregnancies!: Table<PregnancyRecord, string>;
  babies!: Table<BabyRecord, string>;
  enumeration_areas!: Table<EnumerationArea, string>;
  review_flags!: Table<ReviewFlag, string>;
  audit_logs!: Table<AuditLogEntry, string>;
  active_drafts!: Table<ActiveDraft, string>;
  profiles!: Table<UserProfile & { status?: 'active' | 'inactive'; created_at?: string }, string>;

  constructor() {
    super('KaVaSurveyDB');
    this.version(1).stores({
      households: 'id, assessment_hh_id, ea_id, interviewer_id, status, created_at',
      women: 'id, assessment_hh_id, woman_line, ea_id, status',
      deaths: 'id, assessment_hh_id, death_line, ea_id, status',
      pregnancies: 'id, pregnancy_id, assessment_hh_id, woman_line, ea_id, status',
      babies: 'id, baby_id, pregnancy_id, assessment_hh_id',
      enumeration_areas: 'id, code, lga, status',
      review_flags: 'id, status, type, assessment_hh_id, ea_id, severity',
      audit_logs: 'id, record_id, created_at',
      active_drafts: 'assessment_hh_id, ea_id, lastUpdated',
    });
    // version 2: adds profiles store for offline user cache
    this.version(2).stores({
      profiles: 'id, role, email, status',
    });
  }
}

export const kavaDb = new KaVaDatabase();

