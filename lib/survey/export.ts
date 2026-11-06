import * as XLSX from 'xlsx';
import {
  HouseholdRecord,
  WomanRecord,
  DeathRecord,
  PregnancyRecord,
  BabyRecord
} from '@/types/survey';

export interface ExportDataset {
  households: HouseholdRecord[];
  women: WomanRecord[];
  deaths: DeathRecord[];
  pregnancies: PregnancyRecord[];
  babies: BabyRecord[];
}

export function generateKassepWorkbook(dataset: ExportDataset, isIdentified: boolean = false): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Helper to redact PII
  const redact = (val: any) => {
    if (!val) return '';
    return isIdentified ? String(val) : '[REDACTED]';
  };

  const formatFlexDate = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (val.precision === 'exact') return val.date || '';
    if (val.precision === 'month_year') return `${val.month || '?'}/${val.year || '?'}`;
    if (val.precision === 'approximate') return val.approxText || 'Approximate';
    return 'Unknown';
  };

  const formatNumberUnit = (val: any) => {
    if (!val) return '';
    if (typeof val === 'number') return val;
    if (val.isUnknown) return 'Unknown';
    if (val.isDeclined) return 'Declined';
    return `${val.value ?? ''} ${val.unit ?? ''}`.trim();
  };

  // 1. HH_Data
  const hhRows = dataset.households.map(hh => {
    const d = hh.data || {};
    const womenInHh = dataset.women.filter(w => w.assessment_hh_id === hh.assessment_hh_id).length;
    const deathsInHh = dataset.deaths.filter(det => det.assessment_hh_id === hh.assessment_hh_id).length;
    const declaredWomen = Number(d.hh_eligible_women || 0);

    return {
      assessment_hh_id: hh.assessment_hh_id,
      interviewer_id: hh.interviewer_id,
      interview_date: hh.interview_date,
      lga_code: hh.lga_code,
      ward_code: hh.ward_code,
      community: hh.community,
      ea_id: hh.ea_code,
      segment_id: hh.segment_id,
      hh_head_name: redact(d.hh_head_name),
      visit_number: hh.visit_number,
      visit_result: hh.visit_result,
      hh_respondent_name: redact(d.hh_respondent_name),
      hh_respondent_relationship: d.hh_respondent_relationship ?? '',
      hh_consent: d.hh_consent ?? '',
      hh_reference_residence: d.hh_reference_residence ?? '',
      hh_residence_start: formatFlexDate(d.hh_residence_start),
      hh_contact_permission: d.hh_contact_permission ?? '',
      hh_contact: redact(d.hh_contact),
      hh_total_members: d.hh_total_members ?? '',
      hh_total_women: d.hh_total_women ?? '',
      hh_eligible_women: d.hh_eligible_women ?? '',
      any_death: d.any_death ?? '',
      history_check: d.history_check ?? '',
      referral_ids: d.referral_ids ?? '',
      interview_outcome: d.interview_outcome ?? '',
      interviewer_notes: d.interviewer_notes ?? '',
      roster_entered: womenInHh,
      roster_check: womenInHh === declaredWomen ? 'OK' : 'MISMATCH',
      deaths_entered: deathsInHh,
      death_check: (Number(d.any_death) === 1 && deathsInHh === 0) ? 'MISSING_DEATHS' : 'OK'
    };
  });
  const wsHH = XLSX.utils.json_to_sheet(hhRows);
  XLSX.utils.book_append_sheet(wb, wsHH, 'HH_Data');

  // 2. Women_Data
  const womenRows = dataset.women.map(w => {
    const d = w.data || {};
    const pregInWoman = dataset.pregnancies.filter(
      p => p.assessment_hh_id === w.assessment_hh_id && p.woman_line === w.woman_line
    ).length;
    const declaredPreg = Number(d.pregnancy_number || 0);

    return {
      assessment_hh_id: w.assessment_hh_id,
      woman_line: w.woman_line,
      woman_name: redact(d.woman_name),
      woman_dob: formatFlexDate(d.woman_dob),
      woman_age: d.woman_age ?? '',
      age_basis: d.age_basis ?? '',
      relationship_head: d.relationship_head ?? '',
      residence_status: d.residence_status ?? '',
      residence_start: formatFlexDate(d.residence_start),
      residence_end: formatFlexDate(d.residence_end),
      reference_age_eligible: d.reference_age_eligible ?? '',
      available_direct: d.available_direct ?? '',
      woman_interview_status: d.woman_interview_status ?? '',
      woman_id: w.woman_id,
      response_type: d.response_type ?? '',
      proxy_relationship: d.proxy_relationship ?? '',
      proxy_reason: d.proxy_reason ?? '',
      privacy: d.privacy ?? '',
      individual_consent: d.individual_consent ?? '',
      pregnancy_any: d.pregnancy_any ?? '',
      pregnancy_loss_probe: d.pregnancy_loss_probe ?? '',
      birth_probe: d.birth_probe ?? '',
      pregnancy_number: d.pregnancy_number ?? '',
      pregnancies_entered: pregInWoman,
      pregnancy_check: declaredPreg === pregInWoman ? 'OK' : 'MISMATCH'
    };
  });
  const wsWomen = XLSX.utils.json_to_sheet(womenRows);
  XLSX.utils.book_append_sheet(wb, wsWomen, 'Women_Data');

  // 3. Deaths_Data
  const deathRows = dataset.deaths.map(det => {
    const d = det.data || {};
    return {
      assessment_hh_id: det.assessment_hh_id,
      death_line: det.death_line,
      deceased_name: redact(d.deceased_name),
      deceased_sex: d.deceased_sex ?? '',
      age_at_death: formatNumberUnit(d.age_at_death),
      death_date: formatFlexDate(d.death_date),
      death_residence: d.death_residence ?? '',
      pregnant_at_death: d.pregnant_at_death ?? '',
      recent_pregnancy_end: d.recent_pregnancy_end ?? '',
      death_followup: d.death_followup ?? '',
      linked_woman_line: det.linked_woman_line ?? ''
    };
  });
  const wsDeaths = XLSX.utils.json_to_sheet(deathRows);
  XLSX.utils.book_append_sheet(wb, wsDeaths, 'Deaths_Data');

  // 4. Pregnancy_Data
  const pregRows = dataset.pregnancies.map(p => {
    const d = p.data || {};
    const babiesInPreg = dataset.babies.filter(b => b.pregnancy_id === p.pregnancy_id).length;
    const declaredBabies = Number(d.outcome_type) === 1 ? Number(d.babies_number || 1) : 0;

    return {
      assessment_hh_id: p.assessment_hh_id,
      woman_line: p.woman_line,
      episode_no: p.episode_no,
      pregnancy_id: p.pregnancy_id,
      pregnancy_start: formatFlexDate(d.pregnancy_start),
      pregnancy_status_cutoff: d.pregnancy_status_cutoff ?? '',
      pregnancy_current_status: d.pregnancy_current_status ?? '',
      pregnancy_end_date: formatFlexDate(d.pregnancy_end_date),
      date_certainty: d.date_certainty ?? '',
      gestation: formatNumberUnit(d.gestation),
      pregnancy_residence: d.pregnancy_residence ?? '',
      outcome_residence: d.outcome_residence ?? '',
      outcome_type: d.outcome_type ?? '',
      babies_number: d.babies_number ?? '',
      delivery_place: d.delivery_place ?? '',
      maternal_status: d.maternal_status ?? '',
      maternal_death_date: formatFlexDate(d.maternal_death_date),
      death_timing: d.death_timing ?? '',
      end_to_death: formatNumberUnit(d.end_to_death),
      pregnancy_contact: d.pregnancy_contact ?? '',
      contact_actor: Array.isArray(d.contact_actor) ? d.contact_actor.join('; ') : (d.contact_actor ?? ''),
      contact_timing: d.contact_timing ?? '',
      contact_purpose: Array.isArray(d.contact_purpose) ? d.contact_purpose.join('; ') : (d.contact_purpose ?? ''),
      outcome_contact: d.outcome_contact ?? '',
      followup_timing: d.followup_timing ?? '',
      followup_content: Array.isArray(d.followup_content) ? d.followup_content.join('; ') : (d.followup_content ?? ''),
      notification_attempt: d.notification_attempt ?? '',
      reporting_problem: d.reporting_problem ?? '',
      babies_entered: babiesInPreg,
      baby_check: declaredBabies === babiesInPreg ? 'OK' : 'MISMATCH'
    };
  });
  const wsPreg = XLSX.utils.json_to_sheet(pregRows);
  XLSX.utils.book_append_sheet(wb, wsPreg, 'Pregnancy_Data');

  // 5. Baby_Data
  const babyRows = dataset.babies.map(b => {
    const d = b.data || {};
    return {
      assessment_hh_id: b.assessment_hh_id,
      woman_line: b.woman_line,
      episode_no: b.episode_no,
      pregnancy_id: b.pregnancy_id,
      baby_id: b.baby_id,
      baby_sex: d.baby_sex ?? '',
      signs_life: d.signs_life ?? '',
      heartbeat_sign: d.heartbeat_sign ?? '',
      baby_alive: d.baby_alive ?? '',
      baby_death_age: formatNumberUnit(d.baby_death_age),
      baby_death_date: formatFlexDate(d.baby_death_date),
      baby_evidence: d.baby_evidence ?? ''
    };
  });
  const wsBabies = XLSX.utils.json_to_sheet(babyRows);
  XLSX.utils.book_append_sheet(wb, wsBabies, 'Baby_Data');

  return wb;
}

export function downloadKassepExcel(dataset: ExportDataset, isIdentified: boolean = false) {
  const wb = generateKassepWorkbook(dataset, isIdentified);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `KASSEP_Survey_${isIdentified ? 'IDENTIFIED' : 'DEIDENTIFIED'}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}

