import {
  HouseholdRecord,
  WomanRecord,
  DeathRecord,
  PregnancyRecord,
  BabyRecord,
  ReviewFlag
} from '@/types/survey';

export interface QualityCheckResult {
  flags: Omit<ReviewFlag, 'id' | 'created_at'>[];
  warnings: string[];
  referralIds: string[];
  canProceed: boolean;
  blockingReason?: string;
}

/**
 * Validates a date against the survey rules:
 * - Reject future occurrence dates (after today / interview date)
 * - Reference period: 1 August 2024 to 31 July 2026
 * - Allows outcomes after 31 Jul 2026 before the interview date
 */
export function validateSurveyDate(
  dateStr: string | undefined,
  interviewDateStr: string = new Date().toISOString().split('T')[0]
): { valid: boolean; error?: string; warning?: string } {
  if (!dateStr) return { valid: true };

  const parsed = new Date(dateStr);
  const interviewDate = new Date(interviewDateStr);
  const now = new Date();

  if (isNaN(parsed.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Reject future dates
  if (parsed > now || parsed > interviewDate) {
    return { valid: false, error: 'Occurrence date cannot be in the future or after interview date' };
  }

  const cutoff = new Date('2026-07-31T23:59:59');
  if (parsed > cutoff) {
    return {
      valid: true,
      warning: 'Event occurred after the formal KASSEP reference cutoff (31 July 2026)'
    };
  }

  return { valid: true };
}

/**
 * Evaluates Household Level checks (Sections A, C1, F)
 */
export function evaluateHouseholdRules(
  hh: Partial<HouseholdRecord>,
  women: Partial<WomanRecord>[],
  deaths: Partial<DeathRecord>[]
): QualityCheckResult {
  const flags: Omit<ReviewFlag, 'id' | 'created_at'>[] = [];
  const warnings: string[] = [];
  const referralIds: string[] = [];
  const data = hh.data || {};
  const assessment_hh_id = hh.assessment_hh_id || 'UNKNOWN_HH';
  const ea_id = hh.ea_id || '';
  const interviewer_id = hh.interviewer_id;

  // Rule: A14 = 0 -> Close respectfully
  if (Number(data.hh_consent) === 0) {
    return {
      flags,
      warnings: ['Household respondent declined consent. Interview must be closed respectfully.'],
      referralIds,
      canProceed: false,
      blockingReason: 'Respondent declined consent'
    };
  }

  // Rule: A11 in 2-7 -> Record explanation, flag for supervisor follow-up, do not mark ineligible
  const visitResult = Number(data.visit_result);
  if (visitResult >= 2 && visitResult <= 7) {
    flags.push({
      type: 'supervisor_followup',
      level: 'household',
      record_ref: assessment_hh_id,
      assessment_hh_id,
      ea_id,
      interviewer_id,
      status: 'pending',
      severity: 'info',
      message: `Visit attempt result was ${visitResult}. Requires supervisor follow-up. Household remains in sampling frame.`
    });
  }

  // Rule: A15 = 0 -> Flag eligibility review
  if (Number(data.hh_reference_residence) === 0) {
    flags.push({
      type: 'eligibility_review',
      level: 'household',
      record_ref: assessment_hh_id,
      assessment_hh_id,
      ea_id,
      interviewer_id,
      status: 'pending',
      severity: 'warning',
      message: 'Household reported not residing in area during reference period (Aug 2024–Jul 2026). Flagged for eligibility review.'
    });
  }

  // Rule: Roster count vs A21 check
  const declaredEligibleWomen = Number(data.hh_eligible_women || 0);
  const actualWomenCount = women.length;
  if (actualWomenCount !== declaredEligibleWomen && declaredEligibleWomen > 0) {
    flags.push({
      type: 'mismatch',
      level: 'household',
      record_ref: assessment_hh_id,
      assessment_hh_id,
      ea_id,
      interviewer_id,
      status: 'pending',
      severity: 'warning',
      message: `Roster count mismatch: ${declaredEligibleWomen} eligible women declared in A21, but ${actualWomenCount} entered in Section B roster.`
    });
    warnings.push(`Section B roster count (${actualWomenCount}) does not match A21 declared count (${declaredEligibleWomen}).`);
  }

  // Rule: Deaths check vs C01
  const anyDeath = Number(data.any_death);
  if (anyDeath === 1 && deaths.length === 0) {
    warnings.push('C01 indicated household deaths occurred, but no death records have been added in Section C2.');
  }

  return {
    flags,
    warnings,
    referralIds,
    canProceed: true
  };
}

/**
 * Evaluates Woman Level checks (Sections B, D1, D2)
 */
export function evaluateWomanRules(
  woman: Partial<WomanRecord>,
  pregnancies: Partial<PregnancyRecord>[],
  assessment_hh_id: string,
  ea_id: string
): QualityCheckResult {
  const flags: Omit<ReviewFlag, 'id' | 'created_at'>[] = [];
  const warnings: string[] = [];
  const referralIds: string[] = [];
  const data = woman.data || {};
  const woman_line = woman.woman_line || 1;
  const record_ref = `${assessment_hh_id}-W${woman_line}`;

  // Rule: reference_age_eligible = 8 -> Retain, flag for supervisor review
  const ageEligible = Number(data.reference_age_eligible);
  if (ageEligible === 8) {
    flags.push({
      type: 'eligibility_review',
      level: 'woman',
      record_ref,
      assessment_hh_id,
      ea_id,
      status: 'pending',
      severity: 'info',
      message: `Woman ${data.woman_name || woman_line} has uncertain age eligibility (Code 8). Retained for supervisor review.`
    });
  }

  // Rule: D06 consent
  if (Number(data.individual_consent) === 0) {
    return {
      flags,
      warnings: [`Woman ${data.woman_name || woman_line} declined individual interview consent.`],
      referralIds,
      canProceed: false,
      blockingReason: 'Individual consent declined'
    };
  }

  // Rule: Pregnancy screening count check
  const declaredPregnancies = Number(data.pregnancy_number || 0);
  const actualEpisodes = pregnancies.length;
  if (declaredPregnancies > 0 && actualEpisodes !== declaredPregnancies) {
    flags.push({
      type: 'mismatch',
      level: 'woman',
      record_ref,
      assessment_hh_id,
      ea_id,
      status: 'pending',
      severity: 'warning',
      message: `Pregnancy loop mismatch: ${declaredPregnancies} declared in D10, but ${actualEpisodes} pregnancy episodes recorded.`
    });
    warnings.push(`Pregnancy episode count (${actualEpisodes}) does not match D10 declared count (${declaredPregnancies}).`);
  }

  return {
    flags,
    warnings,
    referralIds,
    canProceed: true
  };
}

/**
 * Evaluates Pregnancy & Baby Level checks (Sections E1-E4)
 * Triggers auto-referral flags for:
 * - Possible stillbirth or uncertain signs of life
 * - Maternal death during pregnancy/childbirth/within 42 days
 */
export function evaluatePregnancyAndBabyRules(
  pregnancy: Partial<PregnancyRecord>,
  babies: Partial<BabyRecord>[],
  assessment_hh_id: string,
  ea_id: string
): QualityCheckResult {
  const flags: Omit<ReviewFlag, 'id' | 'created_at'>[] = [];
  const warnings: string[] = [];
  const referralIds: string[] = [];
  const pregData = pregnancy.data || {};
  const pregId = pregnancy.pregnancy_id || `${assessment_hh_id}-P1`;

  // Rule: Baby count vs E11
  const outcomeType = Number(pregData.outcome_type);
  if (outcomeType === 1) { // Birth
    const declaredBabies = Number(pregData.babies_number || 1);
    if (babies.length !== declaredBabies) {
      flags.push({
        type: 'mismatch',
        level: 'pregnancy',
        record_ref: pregId,
        assessment_hh_id,
        ea_id,
        status: 'pending',
        severity: 'warning',
        message: `Baby count mismatch: ${declaredBabies} babies born declared in E11, but ${babies.length} baby records entered.`
      });
      warnings.push(`Baby count (${babies.length}) does not match E11 (${declaredBabies}).`);
    }

    // Evaluate each baby for stillbirth / uncertain signs of life
    babies.forEach((baby, idx) => {
      const bData = baby.data || {};
      const babyRef = `${pregId}-B${baby.baby_id || idx + 1}`;
      const signsLife = Number(bData.signs_life);
      const heartbeat = Number(bData.heartbeat_sign);
      const babyAlive = Number(bData.baby_alive);

      // Check stillbirth criteria:
      // If signs_life != 1 and heartbeat != 1, OR uncertain signs of life (8)
      if (signsLife === 0 || signsLife === 8 || (signsLife !== 1 && heartbeat !== 1)) {
        const refId = `REF-SB-${babyRef}`;
        referralIds.push(refId);
        flags.push({
          type: 'referral_stillbirth',
          level: 'baby',
          record_ref: babyRef,
          assessment_hh_id,
          ea_id,
          status: 'pending',
          severity: 'critical',
          message: `Auto-Referral: Suspected stillbirth or uncertain signs of life (signs_life=${signsLife}, heartbeat=${heartbeat}). Case ${refId} flagged for clinical verification.`
        });
      }

      // Early neonatal death check: alive now = 0
      if (babyAlive === 0) {
        flags.push({
          type: 'referral_stillbirth',
          level: 'baby',
          record_ref: babyRef,
          assessment_hh_id,
          ea_id,
          status: 'pending',
          severity: 'warning',
          message: `Neonatal death reported for baby ${babyRef}. Requires survival reconciliation.`
        });
      }
    });
  }

  // Maternal Survival checks (Section E3)
  const maternalStatus = Number(pregData.maternal_status);
  if (maternalStatus === 0) { // Deceased
    const deathTiming = Number(pregData.death_timing);
    const endToDeath = pregData.end_to_death; // { value, unit }
    let isMaternalDeathSuspected = false;

    // Timing: 1 (While pregnant), 2 (During childbirth), 8 (Unknown)
    if (deathTiming === 1 || deathTiming === 2 || deathTiming === 8) {
      isMaternalDeathSuspected = true;
    } else if (deathTiming === 3 && endToDeath) { // After pregnancy ended
      const unit = endToDeath.unit;
      const val = Number(endToDeath.value || 0);
      // Within 42 days (approx 6 weeks or 1.5 months)
      if (
        (unit === 'days' && val <= 42) ||
        (unit === 'weeks' && val <= 6) ||
        (unit === 'months' && val <= 1)
      ) {
        isMaternalDeathSuspected = true;
      }
    }

    if (isMaternalDeathSuspected) {
      const matRef = `REF-MAT-${pregId}`;
      referralIds.push(matRef);
      flags.push({
        type: 'referral_maternal_death',
        level: 'pregnancy',
        record_ref: pregId,
        assessment_hh_id,
        ea_id,
        status: 'pending',
        severity: 'critical',
        message: `Auto-Referral: Suspected maternal death during pregnancy, childbirth, or within 42 days (timing=${deathTiming}). Case ${matRef} flagged for confidential maternal death surveillance.`
      });
    }
  }

  return {
    flags,
    warnings,
    referralIds,
    canProceed: true
  };
}

/**
 * Evaluates Section C2 Death Roster for pregnancy-associated deaths
 */
export function evaluateDeathRosterRules(
  death: Partial<DeathRecord>,
  assessment_hh_id: string,
  ea_id: string
): QualityCheckResult {
  const flags: Omit<ReviewFlag, 'id' | 'created_at'>[] = [];
  const warnings: string[] = [];
  const referralIds: string[] = [];
  const data = death.data || {};
  const death_line = death.death_line || 1;
  const record_ref = `${assessment_hh_id}-D${death_line}`;

  const sex = Number(data.deceased_sex);
  const pregnantAtDeath = Number(data.pregnant_at_death);
  const recentPregnancyEnd = Number(data.recent_pregnancy_end);

  // Female reproductive death screening
  if (sex === 1) { // Female
    if (pregnantAtDeath === 1 || recentPregnancyEnd === 1 || pregnantAtDeath === 8 || recentPregnancyEnd === 8) {
      const refId = `REF-DEATH-${record_ref}`;
      referralIds.push(refId);
      flags.push({
        type: 'referral_maternal_death',
        level: 'death',
        record_ref,
        assessment_hh_id,
        ea_id,
        status: 'pending',
        severity: 'critical',
        message: `Auto-Referral: Pregnancy-associated death identified in household death screen (pregnant=${pregnantAtDeath}, recent_end=${recentPregnancyEnd}). Verification required.`
      });
    }
  }

  return {
    flags,
    warnings,
    referralIds,
    canProceed: true
  };
}

