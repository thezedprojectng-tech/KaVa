export type QuestionType =
  | 'text'
  | 'long_text'
  | 'integer'
  | 'single_choice'
  | 'multi_choice'
  | 'yes_no_dk_declined'
  | 'date'
  | 'flexible_date'
  | 'number_unit'
  | 'auto_field'
  | 'info_block';

export interface OptionItem {
  code: string | number;
  label: string;
  haLabel?: string;
  description?: string;
}

export interface FlexibleDateValue {
  precision: 'exact' | 'month_year' | 'approximate' | 'unknown';
  date?: string; // YYYY-MM-DD
  year?: number;
  month?: number;
  approxText?: string;
}

export interface NumberUnitValue {
  value?: number;
  unit?: 'days' | 'weeks' | 'months' | 'years';
  isUnknown?: boolean;
  isDeclined?: boolean;
}

export interface SurveyItem {
  no: string; // e.g. "A01", "C01", "D06"
  variable: string;
  label: string;
  haLabel?: string;
  type: QuestionType;
  options?: OptionItem[];
  unitOptions?: string[];
  required?: boolean;
  restricted?: boolean; // PII linkage fields (names, phone, etc.)
  readOnly?: boolean;
  instructions?: string;
  haInstructions?: string;
  showIf?: (values: Record<string, any>, context?: any) => boolean;
  computed?: (values: Record<string, any>, context?: any) => any;
  validate?: (value: any, values: Record<string, any>) => string | null;
}

export interface SurveySectionDef {
  code: string; // 'A', 'B', 'C1', 'C2', 'D1', 'D2', 'E1', 'E2', 'E3', 'E4', 'F'
  title: string;
  haTitle?: string;
  level: 'household' | 'woman' | 'death' | 'pregnancy' | 'baby';
  infoBlocks?: string[];
  haInfoBlocks?: string[];
  items: SurveyItem[];
}

export interface FormDefinition {
  version: string;
  title: string;
  organization: string;
  contact: {
    name: string;
    phone: string;
  };
  referencePeriod: {
    start: string; // 2024-08-01
    end: string;   // 2026-07-31
  };
  sections: SurveySectionDef[];
}

// -------------------------------------------------------------
// Data models matching the Excel *_Data sheets
// -------------------------------------------------------------

export interface HouseholdRecord {
  id: string;
  assessment_hh_id: string;
  ea_id: string;
  ea_code: string;
  lga_code: string;
  ward_code: string;
  community: string;
  segment_id: string;
  interviewer_id: string;
  supervisor_id?: string;
  interview_date: string;
  visit_number: number;
  visit_result: number;
  status: 'draft' | 'submitted' | 'reviewed';
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
}

export interface WomanRecord {
  id: string;
  household_id: string;
  assessment_hh_id: string;
  woman_line: number;
  woman_id: string;
  ea_id: string;
  interviewer_id: string;
  status: 'draft' | 'submitted' | 'reviewed';
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DeathRecord {
  id: string;
  household_id: string;
  assessment_hh_id: string;
  death_line: number;
  ea_id: string;
  interviewer_id: string;
  linked_woman_line?: number;
  status: 'draft' | 'submitted' | 'reviewed';
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PregnancyRecord {
  id: string;
  pregnancy_id: string; // assessment_hh_id-woman_line-episode_no
  household_id: string;
  assessment_hh_id: string;
  woman_line: number;
  episode_no: number;
  ea_id: string;
  interviewer_id: string;
  status: 'draft' | 'submitted' | 'reviewed';
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BabyRecord {
  id: string;
  baby_id: number;
  pregnancy_id: string;
  household_id: string;
  assessment_hh_id: string;
  woman_line: number;
  episode_no: number;
  ea_id: string;
  interviewer_id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HouseholdVisit {
  id?: string;
  household_id: string;
  assessment_hh_id: string;
  ea_id: string;
  visit_number: number;
  visit_result: number;
  visited_at: string;
  interviewer_id: string;
  notes?: string | null;
}

export interface ReviewFlag {
  id: string;
  type: 'duplicate' | 'mismatch' | 'referral_stillbirth' | 'referral_maternal_death' | 'inconsistency' | 'eligibility_review' | 'supervisor_followup';
  level: 'household' | 'woman' | 'death' | 'pregnancy' | 'baby';
  record_ref: string;
  assessment_hh_id: string;
  ea_id: string;
  interviewer_id?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESOLVE_FLAG';
  changed_by: string;
  old_values?: any;
  new_values?: any;
  notes?: string;
  created_at: string;
}

