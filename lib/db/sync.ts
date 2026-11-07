import { kavaDb, ActiveDraft } from './dexie';
import { SEED_KANO_EAS } from './seed-eas';
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
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  evaluateHouseholdRules,
  evaluateWomanRules,
  evaluatePregnancyAndBabyRules,
  evaluateDeathRosterRules
} from '@/lib/survey/routing';

export class SurveySyncService {
  private static instance: SurveySyncService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SurveySyncService {
    if (!SurveySyncService.instance) {
      SurveySyncService.instance = new SurveySyncService();
    }
    return SurveySyncService.instance;
  }

  public async init() {
    if (this.isInitialized) return;

    // Check if EAs exist in Dexie; if not, seed them
    const eaCount = await kavaDb.enumeration_areas.count();
    if (eaCount === 0) {
      await kavaDb.enumeration_areas.bulkPut(SEED_KANO_EAS);
    }

    this.isInitialized = true;
  }

  // --- Active Draft Autosave ---
  public async saveDraft(draft: ActiveDraft): Promise<void> {
    await this.init();
    draft.lastUpdated = new Date().toISOString();
    await kavaDb.active_drafts.put(draft);
  }

  public async getDraft(assessment_hh_id: string): Promise<ActiveDraft | undefined> {
    await this.init();
    return await kavaDb.active_drafts.get(assessment_hh_id);
  }

  public async clearDraft(assessment_hh_id: string): Promise<void> {
    await this.init();
    await kavaDb.active_drafts.delete(assessment_hh_id);
  }

  // --- Final Submit ---
  public async submitInterview(params: {
    assessment_hh_id: string;
    ea_id: string;
    interviewer_id: string;
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
  }): Promise<{ success: boolean; referralIds: string[]; flagsCount: number }> {
    await this.init();
    const now = new Date().toISOString();
    const {
      assessment_hh_id,
      ea_id,
      interviewer_id,
      householdData,
      womenData,
      deathsData,
      pregnanciesData,
      babiesData
    } = params;

    // 1. Create Household Record
    const hhRecord: HouseholdRecord = {
      id: `hh-${assessment_hh_id}-${Date.now()}`,
      assessment_hh_id,
      ea_id,
      ea_code: householdData.ea_id || 'KAN-01',
      lga_code: householdData.lga_code || 'KAN_MUN',
      ward_code: householdData.ward_code || '',
      community: householdData.community || '',
      segment_id: householdData.segment_id || '01',
      interviewer_id,
      interview_date: householdData.interview_date || now.split('T')[0],
      visit_number: Number(householdData.visit_number || 1),
      visit_result: Number(householdData.visit_result || 1),
      status: 'submitted',
      data: householdData,
      created_at: now,
      updated_at: now,
      submitted_at: now
    };

    // 2. Create Women Records
    const womenRecords: WomanRecord[] = womenData.map((w, idx) => ({
      id: `w-${assessment_hh_id}-${w.woman_line}-${Date.now() + idx}`,
      household_id: hhRecord.id,
      assessment_hh_id,
      woman_line: w.woman_line,
      woman_id: `${assessment_hh_id}-${w.woman_line}`,
      ea_id,
      interviewer_id,
      status: 'submitted',
      data: w.data,
      created_at: now,
      updated_at: now
    }));

    // 3. Create Death Records
    const deathRecords: DeathRecord[] = deathsData.map((d, idx) => ({
      id: `d-${assessment_hh_id}-${d.death_line}-${Date.now() + idx}`,
      household_id: hhRecord.id,
      assessment_hh_id,
      death_line: d.death_line,
      ea_id,
      interviewer_id,
      status: 'submitted',
      data: d.data,
      created_at: now,
      updated_at: now
    }));

    // 4. Create Pregnancy Records
    const pregnancyRecords: PregnancyRecord[] = pregnanciesData.map((p, idx) => ({
      id: `p-${p.pregnancy_id}-${Date.now() + idx}`,
      pregnancy_id: p.pregnancy_id,
      household_id: hhRecord.id,
      assessment_hh_id,
      woman_line: p.woman_line,
      episode_no: p.episode_no,
      ea_id,
      interviewer_id,
      status: 'submitted',
      data: p.data,
      created_at: now,
      updated_at: now
    }));

    // 5. Create Baby Records
    const babyRecords: BabyRecord[] = babiesData.map((b, idx) => ({
      id: `b-${b.pregnancy_id}-${b.baby_id}-${Date.now() + idx}`,
      baby_id: b.baby_id,
      pregnancy_id: b.pregnancy_id,
      household_id: hhRecord.id,
      assessment_hh_id,
      woman_line: b.woman_line,
      episode_no: b.episode_no,
      ea_id,
      interviewer_id,
      data: b.data,
      created_at: now,
      updated_at: now
    }));

    // 6. Run Quality Checks and Auto-Referral Flags
    const collectedFlags: ReviewFlag[] = [];
    const allReferralIds: string[] = [];

    // Household flags
    const hhCheck = evaluateHouseholdRules(hhRecord, womenRecords, deathRecords);
    hhCheck.flags.forEach(f => {
      collectedFlags.push({
        ...f,
        id: `flag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ea_id,
        interviewer_id,
        status: 'pending',
        created_at: now
      });
    });
    allReferralIds.push(...hhCheck.referralIds);

    // Women flags
    womenRecords.forEach(w => {
      const wPregnancies = pregnancyRecords.filter(p => p.woman_line === w.woman_line);
      const wCheck = evaluateWomanRules(w, wPregnancies, assessment_hh_id, ea_id);
      wCheck.flags.forEach(f => {
        collectedFlags.push({
          ...f,
          id: `flag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ea_id,
          interviewer_id,
          status: 'pending',
          created_at: now
        });
      });
      allReferralIds.push(...wCheck.referralIds);
    });

    // Death flags
    deathRecords.forEach(d => {
      const dCheck = evaluateDeathRosterRules(d, assessment_hh_id, ea_id);
      dCheck.flags.forEach(f => {
        collectedFlags.push({
          ...f,
          id: `flag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ea_id,
          interviewer_id,
          status: 'pending',
          created_at: now
        });
      });
      allReferralIds.push(...dCheck.referralIds);
    });

    // Pregnancy & Baby flags
    pregnancyRecords.forEach(p => {
      const pBabies = babyRecords.filter(b => b.pregnancy_id === p.pregnancy_id);
      const pCheck = evaluatePregnancyAndBabyRules(p, pBabies, assessment_hh_id, ea_id);
      pCheck.flags.forEach(f => {
        collectedFlags.push({
          ...f,
          id: `flag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ea_id,
          interviewer_id,
          status: 'pending',
          created_at: now
        });
      });
      allReferralIds.push(...pCheck.referralIds);
    });

    // Link referral IDs into Section F02
    hhRecord.data.referral_ids = allReferralIds.join(', ');

    // Household Visit Record (A10/A11)
    const visitRecord = {
      id: `visit-${assessment_hh_id}-${hhRecord.visit_number || 1}-${Date.now()}`,
      household_id: hhRecord.id,
      assessment_hh_id,
      ea_id,
      visit_number: Number(householdData.visit_number || 1),
      visit_result: Number(householdData.visit_result || 1),
      visited_at: householdData.interview_date ? `${householdData.interview_date}T12:00:00.000Z` : now,
      interviewer_id,
      notes: householdData.visit_notes || null
    };

    // 7. Persist to Dexie (IndexedDB)
    await kavaDb.transaction('rw', [
      kavaDb.households,
      kavaDb.women,
      kavaDb.deaths,
      kavaDb.pregnancies,
      kavaDb.babies,
      kavaDb.household_visits,
      kavaDb.review_flags,
      kavaDb.audit_logs,
      kavaDb.active_drafts,
      kavaDb.enumeration_areas
    ], async () => {
      await kavaDb.households.put(hhRecord);
      if (womenRecords.length > 0) await kavaDb.women.bulkPut(womenRecords);
      if (deathRecords.length > 0) await kavaDb.deaths.bulkPut(deathRecords);
      if (pregnancyRecords.length > 0) await kavaDb.pregnancies.bulkPut(pregnancyRecords);
      if (babyRecords.length > 0) await kavaDb.babies.bulkPut(babyRecords);
      await kavaDb.household_visits.put(visitRecord);
      if (collectedFlags.length > 0) await kavaDb.review_flags.bulkPut(collectedFlags);

      // Audit Log
      await kavaDb.audit_logs.put({
        id: `audit-${Date.now()}`,
        table_name: 'households',
        record_id: assessment_hh_id,
        action: 'CREATE',
        changed_by: interviewer_id,
        new_values: { assessment_hh_id, womenCount: womenRecords.length, pregnanciesCount: pregnancyRecords.length },
        created_at: now
      });

      // Clear draft
      await kavaDb.active_drafts.delete(assessment_hh_id);

      // Update EA progress
      const ea = await kavaDb.enumeration_areas.get(ea_id);
      if (ea) {
        ea.completedHouseholds = (ea.completedHouseholds || 0) + 1;
        if (ea.completedHouseholds >= ea.targetHouseholds) {
          ea.status = 'completed';
        } else {
          ea.status = 'in_progress';
        }
        ea.updatedAt = now;
        await kavaDb.enumeration_areas.put(ea);
      }
    });

    // 8. Sync to Supabase in strict relational order required by RLS:
    //    Step 8a: Insert the household with status 'draft' first (never as 'submitted')
    //    Step 8b: Insert children while household is 'draft' (women, deaths, pregnancies, babies, household_visits, review_flags)
    //    Step 8c: Only then update the household to status 'submitted' (setting submitted_at)
    if (isSupabaseConfigured && supabase) {
      try {
        let targetEaId = ea_id;
        try {
          const { data: matchedEa } = await supabase
            .from('enumeration_areas')
            .select('id')
            .or(`id.eq.${ea_id},code.eq.${householdData.ea_id || ea_id}`)
            .limit(1)
            .maybeSingle();
          if (matchedEa?.id) {
            targetEaId = matchedEa.id;
          }
        } catch {}

        // Step 8a: Insert household as draft
        const draftHouseholdPayload = {
          assessment_hh_id: hhRecord.assessment_hh_id,
          ea_id: targetEaId,
          interviewer_id,
          supervisor_id: hhRecord.supervisor_id || null,
          visit_number: hhRecord.visit_number,
          visit_result: hhRecord.visit_result,
          status: 'draft',
          data: hhRecord.data,
          created_at: hhRecord.created_at,
          updated_at: hhRecord.updated_at
        };

        const { data: insertedHh, error: hhInsertError } = await supabase
          .from('households')
          .upsert(draftHouseholdPayload, { onConflict: 'assessment_hh_id' })
          .select('id')
          .single();

        if (hhInsertError) {
          console.warn('Supabase draft household insert error:', hhInsertError);
          throw hhInsertError;
        }

        const supabaseHhId = insertedHh?.id || hhRecord.id;

        // Step 8b: Insert children while parent household is in 'draft' status
        const womenPayload = womenRecords.map(w => ({
          ...w,
          household_id: supabaseHhId,
          ea_id: targetEaId,
          interviewer_id
        }));

        const deathsPayload = deathRecords.map(d => ({
          ...d,
          household_id: supabaseHhId,
          ea_id: targetEaId,
          interviewer_id
        }));

        const pregnanciesPayload = pregnancyRecords.map(p => ({
          ...p,
          household_id: supabaseHhId,
          ea_id: targetEaId,
          interviewer_id
        }));

        const babiesPayload = babyRecords.map(b => ({
          ...b,
          ea_id: targetEaId,
          interviewer_id
        }));

        const visitsPayload = [{
          household_id: supabaseHhId,
          assessment_hh_id,
          ea_id: targetEaId,
          visit_number: visitRecord.visit_number,
          visit_result: visitRecord.visit_result,
          visited_at: visitRecord.visited_at,
          interviewer_id,
          notes: visitRecord.notes
        }];

        const flagsPayload = collectedFlags.map(f => ({
          type: f.type,
          level: f.level,
          record_ref: f.record_ref,
          assessment_hh_id: f.assessment_hh_id,
          ea_id: targetEaId,
          interviewer_id,
          status: 'pending',
          severity: f.severity,
          message: f.message,
          notes: f.notes || null,
          created_at: f.created_at
        }));

        if (womenPayload.length > 0) {
          const { error: wErr } = await supabase.from('women').upsert(womenPayload, { onConflict: 'assessment_hh_id,woman_line' });
          if (wErr) console.warn('Supabase women sync error:', wErr);
        }

        if (deathsPayload.length > 0) {
          const { error: dErr } = await supabase.from('deaths').upsert(deathsPayload, { onConflict: 'assessment_hh_id,death_line' });
          if (dErr) console.warn('Supabase deaths sync error:', dErr);
        }

        if (pregnanciesPayload.length > 0) {
          const { error: pErr } = await supabase.from('pregnancies').upsert(pregnanciesPayload, { onConflict: 'pregnancy_id' });
          if (pErr) console.warn('Supabase pregnancies sync error:', pErr);
        }

        if (babiesPayload.length > 0) {
          const { error: bErr } = await supabase.from('babies').upsert(babiesPayload, { onConflict: 'pregnancy_id,baby_id' });
          if (bErr) console.warn('Supabase babies sync error:', bErr);
        }

        if (visitsPayload.length > 0) {
          const { error: vErr } = await supabase.from('household_visits').insert(visitsPayload);
          if (vErr) console.warn('Supabase visits sync error:', vErr);
        }

        if (flagsPayload.length > 0) {
          const { error: fErr } = await supabase.from('review_flags').insert(flagsPayload);
          if (fErr) console.warn('Supabase flags sync error:', fErr);
        }

        // Step 8c: Only then update the household to status 'submitted' and set submitted_at
        const { error: submitErr } = await supabase
          .from('households')
          .update({
            status: 'submitted',
            submitted_at: now,
            updated_at: now,
            data: hhRecord.data
          })
          .eq('id', supabaseHhId);

        if (submitErr) {
          console.warn('Supabase submit status update error:', submitErr);
        }
      } catch (err) {
        console.warn('Background Supabase sync failed, retained in local IndexedDB:', err);
      }
    }

    return {
      success: true,
      referralIds: allReferralIds,
      flagsCount: collectedFlags.length
    };
  }

  // --- Fetch Methods ---
  public async getEnumerationAreas(): Promise<EnumerationArea[]> {
    await this.init();
    const list = await kavaDb.enumeration_areas.toArray();
    if (list.length === 0) {
      try {
        await kavaDb.enumeration_areas.bulkPut(SEED_KANO_EAS);
      } catch (err) {
        console.warn('Dexie bulkPut warning:', err);
      }
      return SEED_KANO_EAS;
    }
    return list;
  }

  public async getHouseholds(filter?: { ea_id?: string }): Promise<HouseholdRecord[]> {
    await this.init();
    if (filter?.ea_id) {
      return await kavaDb.households.where('ea_id').equals(filter.ea_id).toArray();
    }
    return await kavaDb.households.toArray();
  }

  public async getWomen(): Promise<WomanRecord[]> {
    await this.init();
    return await kavaDb.women.toArray();
  }

  public async getDeaths(): Promise<DeathRecord[]> {
    await this.init();
    return await kavaDb.deaths.toArray();
  }

  public async getPregnancies(): Promise<PregnancyRecord[]> {
    await this.init();
    return await kavaDb.pregnancies.toArray();
  }

  public async getBabies(): Promise<BabyRecord[]> {
    await this.init();
    return await kavaDb.babies.toArray();
  }

  public async getReviewFlags(): Promise<ReviewFlag[]> {
    await this.init();
    return await kavaDb.review_flags.toArray();
  }

  public async resolveFlag(flagId: string, resolvedBy: string, notes: string): Promise<void> {
    await this.init();
    const flag = await kavaDb.review_flags.get(flagId);
    if (!flag) return;

    flag.status = 'resolved';
    flag.resolved_by = resolvedBy;
    flag.resolved_at = new Date().toISOString();
    flag.notes = notes;

    await kavaDb.review_flags.put(flag);

    // Audit log
    await kavaDb.audit_logs.put({
      id: `audit-${Date.now()}`,
      table_name: 'review_flags',
      record_id: flagId,
      action: 'RESOLVE_FLAG',
      changed_by: resolvedBy,
      notes,
      created_at: new Date().toISOString()
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('review_flags').update({
          status: 'resolved',
          resolved_by: resolvedBy,
          resolved_at: flag.resolved_at,
          notes
        }).eq('id', flagId);
      } catch (e) {
        console.warn('Supabase flag resolve sync failed:', e);
      }
    }
  }

  public async upsertEnumerationAreas(eas: EnumerationArea[]): Promise<void> {
    await this.init();
    await kavaDb.enumeration_areas.bulkPut(eas);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('enumeration_areas').upsert(eas);
      } catch (e) {
        console.warn('Supabase EAs upsert failed:', e);
      }
    }
  }

  // --- Profiles & Staff Management ---
  public async getProfiles(): Promise<UserProfile[]> {
    await this.init();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((p: any) => ({
            id: p.id,
            role: p.role,
            fullName: p.full_name,
            email: p.email,
            phone: p.phone,
            assignedLgas: p.assigned_lgas || [],
            assignedEas: p.assigned_eas || [],
            status: p.status || 'active',
            createdAt: p.created_at
          }));
        }
      } catch (err) {
        console.warn('Supabase profiles query failed, falling back to local storage:', err);
      }
    }
    return await kavaDb.profiles.toArray();
  }

  public async upsertProfile(profile: UserProfile): Promise<void> {
    await this.init();
    const localProfile = {
      ...profile,
      status: profile.status || 'active',
      createdAt: profile.createdAt || new Date().toISOString()
    };
    await kavaDb.profiles.put(localProfile);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').upsert({
          id: profile.id,
          role: profile.role,
          full_name: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          assigned_lgas: profile.assignedLgas,
          assigned_eas: profile.assignedEas,
          status: profile.status || 'active',
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase profile upsert failed:', err);
      }
    }
  }

  public async updateProfileStatus(userId: string, status: 'active' | 'inactive'): Promise<void> {
    await this.init();
    const existing = await kavaDb.profiles.get(userId);
    if (existing) {
      existing.status = status;
      await kavaDb.profiles.put(existing);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update({ status, updated_at: new Date().toISOString() }).eq('id', userId);
      } catch (err) {
        console.warn('Supabase profile status update failed:', err);
      }
    }
  }

  public async updateProfileAssignments(
    userId: string,
    assignedEas: string[],
    assignedLgas: string[]
  ): Promise<void> {
    await this.init();
    const existing = await kavaDb.profiles.get(userId);
    if (existing) {
      existing.assignedEas = assignedEas;
      existing.assignedLgas = assignedLgas;
      await kavaDb.profiles.put(existing);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update({
          assigned_eas: assignedEas,
          assigned_lgas: assignedLgas,
          updated_at: new Date().toISOString()
        }).eq('id', userId);
      } catch (err) {
        console.warn('Supabase assignments update failed:', err);
      }
    }
  }
}

export const surveySyncService = SurveySyncService.getInstance();

