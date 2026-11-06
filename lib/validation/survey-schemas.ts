import { z } from 'zod';

// Flexible date precision schema
export const flexibleDateSchema = z.object({
  precision: z.enum(['exact', 'month_year', 'approximate', 'unknown']),
  date: z.string().optional(),
  year: z.number().int().min(1900).max(2030).optional(),
  month: z.number().int().min(1).max(12).optional(),
  approxText: z.string().max(200).optional()
}).optional().nullable();

// Number with unit schema (e.g. gestational age, baby age at death)
export const numberUnitSchema = z.object({
  value: z.number().min(0).optional(),
  unit: z.enum(['days', 'weeks', 'months', 'years']).optional(),
  isUnknown: z.boolean().optional(),
  isDeclined: z.boolean().optional()
}).optional().nullable();

// Level 1: Household Schema (Sections A, C1, F)
export const householdSubmitSchema = z.object({
  assessment_hh_id: z.string().min(1, 'Household ID is required').max(50),
  ea_id: z.string().min(1, 'EA ID is required'),
  ea_code: z.string().optional(),
  interviewer_id: z.string().min(1, 'Interviewer ID is required'),
  supervisor_id: z.string().optional(),
  interview_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD date required'),
  visit_number: z.number().int().min(1).max(10).default(1),
  visit_result: z.number().int().min(1).max(7).default(1),
  status: z.enum(['draft', 'submitted', 'reviewed']).default('submitted'),
  data: z.record(z.string(), z.any())
});

// Level 2a: Woman Roster Schema (Sections B, D1, D2)
export const womanSubmitSchema = z.object({
  assessment_hh_id: z.string().min(1),
  woman_line: z.number().int().min(1),
  woman_id: z.string().min(1),
  ea_id: z.string().min(1),
  interviewer_id: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'reviewed']).default('submitted'),
  data: z.object({
    woman_name: z.string().min(1, 'Woman name is required'),
    woman_age: z.number().int().min(12).max(100),
    relationship_head: z.coerce.number().int().min(1).max(8).optional(),
    residence_status: z.coerce.number().int().min(1).max(3).default(1),
    reference_age_eligible: z.coerce.number().int().min(0).max(8).default(1),
    available_direct: z.coerce.number().int().optional(),
    individual_consent: z.coerce.number().int().optional(),
    pregnancy_any: z.coerce.number().int().optional(),
    pregnancy_number: z.coerce.number().int().min(0).optional()
  }).passthrough()
});

// Level 2b: Death Roster Schema (Section C2)
export const deathSubmitSchema = z.object({
  assessment_hh_id: z.string().min(1),
  death_line: z.number().int().min(1),
  ea_id: z.string().min(1),
  interviewer_id: z.string().optional(),
  linked_woman_line: z.number().int().optional(),
  status: z.enum(['draft', 'submitted', 'reviewed']).default('submitted'),
  data: z.object({
    deceased_name: z.string().min(1, 'Deceased name is required'),
    deceased_sex: z.coerce.number().int().min(1).max(8),
    age_at_death: numberUnitSchema.optional(),
    pregnant_at_death: z.coerce.number().int().optional(),
    recent_pregnancy_end: z.coerce.number().int().optional(),
    death_followup: z.coerce.number().int().optional()
  }).passthrough()
});

// Level 3: Pregnancy Episode Schema (Sections E1, E3, E4)
export const pregnancySubmitSchema = z.object({
  pregnancy_id: z.string().min(1),
  assessment_hh_id: z.string().min(1),
  woman_line: z.number().int().min(1),
  episode_no: z.number().int().min(1),
  ea_id: z.string().min(1),
  interviewer_id: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'reviewed']).default('submitted'),
  data: z.object({
    outcome_type: z.coerce.number().int().min(1).max(9),
    babies_number: z.coerce.number().int().min(0).optional(),
    delivery_place: z.coerce.number().int().optional(),
    maternal_status: z.coerce.number().int().optional(),
    death_timing: z.coerce.number().int().optional(),
    pregnancy_contact: z.coerce.number().int().optional()
  }).passthrough()
});

// Level 4: Baby Record Schema (Section E2)
export const babySubmitSchema = z.object({
  baby_id: z.number().int().min(1),
  pregnancy_id: z.string().min(1),
  assessment_hh_id: z.string().min(1),
  woman_line: z.number().int().min(1),
  episode_no: z.number().int().min(1),
  ea_id: z.string().min(1),
  interviewer_id: z.string().optional(),
  data: z.object({
    baby_sex: z.coerce.number().int().min(1).max(8),
    signs_life: z.coerce.number().int().min(0).max(9),
    heartbeat_sign: z.coerce.number().int().optional(),
    baby_alive: z.coerce.number().int().optional()
  }).passthrough()
});

// Complete Submission Package Schema
export const fullInterviewSubmissionSchema = z.object({
  assessment_hh_id: z.string().min(1),
  ea_id: z.string().min(1),
  interviewer_id: z.string().min(1),
  householdData: z.record(z.string(), z.any()),
  womenData: z.array(z.object({
    woman_line: z.number().int().min(1),
    data: z.record(z.string(), z.any())
  })),
  deathsData: z.array(z.object({
    death_line: z.number().int().min(1),
    data: z.record(z.string(), z.any())
  })),
  pregnanciesData: z.array(z.object({
    pregnancy_id: z.string().min(1),
    woman_line: z.number().int().min(1),
    episode_no: z.number().int().min(1),
    data: z.record(z.string(), z.any())
  })),
  babiesData: z.array(z.object({
    baby_id: z.number().int().min(1),
    pregnancy_id: z.string().min(1),
    woman_line: z.number().int().min(1),
    episode_no: z.number().int().min(1),
    data: z.record(z.string(), z.any())
  }))
});

