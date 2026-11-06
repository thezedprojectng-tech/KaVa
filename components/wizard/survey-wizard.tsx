"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { KASSEP_FORM_DEFINITION } from '@/lib/survey/form-definition';
import { SectionBRoster } from './section-b-roster';
import { SectionCDeath } from './section-c-death';
import { SectionDScreening } from './section-d-screening';
import { SectionEPregnancy } from './section-e-pregnancy';
import { SectionFClosure } from './section-f-closure';
import { QuestionRenderer } from './question-renderer';
import { Button } from '@/components/ui/button';
import { surveySyncService } from '@/lib/db/sync';
import { ActiveDraft } from '@/lib/db/dexie';
import {
  evaluateHouseholdRules,
  evaluateWomanRules,
  evaluatePregnancyAndBabyRules,
  evaluateDeathRosterRules
} from '@/lib/survey/routing';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  ClipboardCheck,
  Home,
  Users,
  Baby,
  UserMinus,
  Sparkles,
  ShieldCheck,
  Building2,
  HeartPulse
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SurveyWizardProps {
  initialEaCode?: string;
  initialHhId?: string;
  interviewerId: string;
  onComplete: () => void;
  language: 'en' | 'ha';
}

export function SurveyWizard({
  initialEaCode = 'KAN-MUN-001',
  initialHhId,
  interviewerId,
  onComplete,
  language
}: SurveyWizardProps) {
  const isHausa = language === 'ha';

  // Wizard Navigation States
  // 0: Section A (Household)
  // 1: Section B (Female Roster)
  // 2: Section C (Death Screen & Roster)
  // 3: Section D (Individual Woman Screening)
  // 4: Section E (Pregnancy & Baby Episodes)
  // 5: Section F (Closure & Referrals)
  // 6: Review & Final Submit Screen
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [activeWomanIdx, setActiveWomanIdx] = useState<number>(0);
  const [activePregIdx, setActivePregIdx] = useState<number>(0);

  // Core Survey Data
  const [householdData, setHouseholdData] = useState<Record<string, any>>(() => ({
    interviewer_id: interviewerId,
    interview_date: new Date().toISOString().split('T')[0],
    ea_id: initialEaCode,
    lga_code: 'KAN_MUN',
    ward_code: 'Shahuchi',
    community: 'Shahuchi North',
    segment_id: '01',
    assessment_hh_id: initialHhId || `KAN-01-${Math.floor(100 + Math.random() * 900)}`,
    visit_number: 1,
    visit_result: 1,
    hh_consent: 1,
    hh_reference_residence: 1,
    hh_eligible_women: 1
  }));

  const [women, setWomen] = useState<Array<{ woman_line: number; data: Record<string, any> }>>([]);
  const [deaths, setDeaths] = useState<Array<{ death_line: number; data: Record<string, any> }>>([]);
  const [pregnancies, setPregnancies] = useState<Array<{
    pregnancy_id: string;
    woman_line: number;
    episode_no: number;
    data: Record<string, any>;
  }>>([]);
  const [babies, setBabies] = useState<Array<{
    baby_id: number;
    pregnancy_id: string;
    woman_line: number;
    episode_no: number;
    data: Record<string, any>;
  }>>([]);

  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdReferralIds, setCreatedReferralIds] = useState<string[]>([]);

  // Load existing draft if exists
  useEffect(() => {
    async function loadDraft() {
      const draft = await surveySyncService.getDraft(householdData.assessment_hh_id);
      if (draft) {
        setHouseholdData(draft.householdData || householdData);
        setWomen(draft.womenData || []);
        setDeaths(draft.deathsData || []);
        setPregnancies(draft.pregnanciesData || []);
        setBabies(draft.babiesData || []);
        setCurrentStep(draft.currentStep || 0);
      }
    }
    loadDraft();
  }, [householdData.assessment_hh_id]);

  // Debounced Autosave to IndexedDB
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    setAutosaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await surveySyncService.saveDraft({
          assessment_hh_id: householdData.assessment_hh_id,
          ea_id: householdData.ea_id || initialEaCode,
          interviewer_id: interviewerId,
          currentStep,
          currentSection: sectionTitles[currentStep],
          activeWomanIndex: activeWomanIdx,
          activePregnancyIndex: activePregIdx,
          activeBabyIndex: 0,
          householdData,
          womenData: women,
          deathsData: deaths,
          pregnanciesData: pregnancies,
          babiesData: babies,
          lastUpdated: new Date().toISOString()
        });
        setAutosaveStatus('saved');
      } catch (err) {
        console.error('Autosave error:', err);
        setAutosaveStatus('offline');
      }
    }, 800);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [householdData, women, deaths, pregnancies, babies, currentStep]);

  // Routing and Validation Engine
  const householdRules = useMemo(() => {
    return evaluateHouseholdRules({ data: householdData } as any, women as any, deaths as any);
  }, [householdData, women, deaths]);

  const eligibleWomen = useMemo(() => {
    return women.filter(w => {
      const res = Number(w.data?.residence_status);
      const ageElig = Number(w.data?.reference_age_eligible);
      return res !== 3 && ageElig === 1;
    });
  }, [women]);

  // Auto-Referral Surveillance Scanner
  const currentReferralIds = useMemo(() => {
    const ids: string[] = [];

    // 1. Maternal Deaths in Section C
    deaths.forEach(d => {
      const isFemaleRepro = Number(d.data?.deceased_sex) === 2 &&
        Number(d.data?.death_age_years) >= 12 && Number(d.data?.death_age_years) <= 50;
      const pregTiming = Number(d.data?.death_pregnancy_timing);
      if (isFemaleRepro && [1, 2, 3, 8].includes(pregTiming)) {
        ids.push(`REF-MAT-${householdData.assessment_hh_id}-D${d.death_line}`);
      }
    });

    // 2. Stillbirths in Section E
    babies.forEach(b => {
      const signsLife = Number(b.data?.signs_life);
      if (signsLife === 0 || signsLife === 8) {
        ids.push(`REF-SB-${householdData.assessment_hh_id}-P${b.episode_no}-B${b.baby_id}`);
      }
    });

    return ids;
  }, [deaths, babies, householdData.assessment_hh_id]);

  // Step Navigators
  const canGoNext = () => {
    if (currentStep === 0) {
      if (Number(householdData.hh_consent) === 0) return false;
      return Boolean(householdData.assessment_hh_id && householdData.interviewer_id);
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (Number(householdData.hh_consent) === 0) {
        alert(isHausa ? 'Mai amsa bai amince ba. Za a rufe binciken.' : 'Household respondent declined consent. Interview will be closed.');
        setCurrentStep(5);
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (eligibleWomen.length > 0) {
        setActiveWomanIdx(0);
        setCurrentStep(3);
      } else {
        setCurrentStep(5);
      }
    } else if (currentStep === 3) {
      const currentWoman = eligibleWomen[activeWomanIdx];
      const hasPregnancies =
        Number(currentWoman?.data?.pregnancy_any) === 1 ||
        Number(currentWoman?.data?.pregnancy_loss_probe) === 1 ||
        Number(currentWoman?.data?.birth_probe) === 1 ||
        Number(currentWoman?.data?.pregnancy_number) > 0;

      if (hasPregnancies) {
        const womanLine = currentWoman.woman_line;
        const declaredCount = Number(currentWoman.data.pregnancy_number || 1);
        const existingPregs = pregnancies.filter(p => p.woman_line === womanLine);

        if (existingPregs.length === 0) {
          const newPregs = [];
          for (let ep = 1; ep <= declaredCount; ep++) {
            newPregs.push({
              pregnancy_id: `${householdData.assessment_hh_id}-W${womanLine}-P${ep}`,
              woman_line: womanLine,
              episode_no: ep,
              data: {
                pregnancy_id: `${householdData.assessment_hh_id}-W${womanLine}-P${ep}`,
                outcome_type: 1,
                babies_number: 1,
                maternal_status: Number(currentWoman.data.response_type) === 1 ? 1 : undefined
              }
            });
          }
          setPregnancies([...pregnancies, ...newPregs]);
        }

        setActivePregIdx(0);
        setCurrentStep(4);
      } else {
        if (activeWomanIdx < eligibleWomen.length - 1) {
          setActiveWomanIdx(activeWomanIdx + 1);
        } else {
          setCurrentStep(5);
        }
      }
    } else if (currentStep === 4) {
      const currentWoman = eligibleWomen[activeWomanIdx];
      const womanPregs = pregnancies.filter(p => p.woman_line === currentWoman?.woman_line);

      if (activePregIdx < womanPregs.length - 1) {
        setActivePregIdx(activePregIdx + 1);
      } else {
        if (activeWomanIdx < eligibleWomen.length - 1) {
          setActiveWomanIdx(activeWomanIdx + 1);
          setCurrentStep(3);
        } else {
          setCurrentStep(5);
        }
      }
    } else if (currentStep === 5) {
      setCurrentStep(6);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      if (currentStep === 4 && activePregIdx > 0) {
        setActivePregIdx(activePregIdx - 1);
      } else if (currentStep === 4 && activePregIdx === 0) {
        setCurrentStep(3);
      } else if (currentStep === 3 && activeWomanIdx > 0) {
        setActiveWomanIdx(activeWomanIdx - 1);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const result = await surveySyncService.submitInterview({
      assessment_hh_id: householdData.assessment_hh_id,
      ea_id: householdData.ea_id || initialEaCode,
      interviewer_id: interviewerId,
      householdData,
      womenData: women,
      deathsData: deaths,
      pregnanciesData: pregnancies,
      babiesData: babies
    });

    setIsSubmitting(false);
    if (result.success) {
      setCreatedReferralIds(result.referralIds);
      setSubmitSuccess(true);
    }
  };

  const sectionTitles = [
    isHausa ? 'Sashe A: Gano Gida da Yarda' : 'Section A: Household Identification & Consent',
    isHausa ? 'Sashe B: Jerin Mata Masu Cancanta' : 'Section B: Female Roster',
    isHausa ? 'Sashe C: Rasuwar Gida' : 'Section C: Household Deaths & Mortality',
    isHausa ? 'Sashe D: Tantance Ciki' : 'Section D: Individual Woman Screening',
    isHausa ? 'Sashe E: Tarihin Ciki da Jarirai' : 'Section E: Pregnancy Episodes & Baby Record',
    isHausa ? 'Sashe F: Kammalawa da Shawara' : 'Section F: Closure & Referrals',
    isHausa ? 'Duba da Tabbatarwa' : 'Review & Final Verification'
  ];

  const sectionStepLabels = [
    'Section A of F',
    'Section B of F',
    'Section C of F',
    'Section D of F',
    'Section E of F',
    'Section F of F',
    'Verification & Submit'
  ];

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="size-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="size-10" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {isHausa ? 'An Aika Binciken Gida Cikin Nasara!' : 'Household Assessment Successfully Submitted!'}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Household ID <span className="font-mono text-primary font-bold">{householdData.assessment_hh_id}</span> has been stored in local IndexedDB and queued for secure Supabase cloud sync.
        </p>

        {createdReferralIds.length > 0 && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-left max-w-md mx-auto space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
              <AlertTriangle className="size-4" />
              CONFIDENTIAL SURVEILLANCE REFERRALS TRIGGERED:
            </div>
            <div className="flex flex-wrap gap-2">
              {createdReferralIds.map(id => (
                <span key={id} className="font-mono text-xs px-2 py-0.5 rounded-md bg-destructive text-destructive-foreground font-semibold">
                  {id}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              These records have been flagged in the supervisor review queue for clinical verbal autopsy verification.
            </p>
          </div>
        )}

        <div className="pt-4 flex justify-center gap-3">
          <Button
            onClick={onComplete}
            className="font-medium px-6"
          >
            {isHausa ? 'Koma Taswirar EA' : 'Return to EA Workspace'}
          </Button>
        </div>
      </div>
    );
  }

  const currentWoman = eligibleWomen[activeWomanIdx];
  const womanPregs = pregnancies.filter(p => p.woman_line === currentWoman?.woman_line);
  const currentPreg = womanPregs[activePregIdx] || pregnancies[0];
  const currentBabies = babies.filter(b => b.pregnancy_id === currentPreg?.pregnancy_id);

  // Group Section A items into 3 logical cards
  const sectionAItems = KASSEP_FORM_DEFINITION.sections[0].items;
  const sectionAGroup1 = sectionAItems.slice(0, 7); // A01 - A07
  const sectionAGroup2 = sectionAItems.slice(7, 14); // A08 - A14
  const sectionAGroup3 = sectionAItems.slice(14); // A15 - A21

  const progressPct = Math.round(((currentStep + 1) / 7) * 100);

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6 pb-28">
      {/* Top Header & Autosave Indicator */}
      <header className="p-4 rounded-xl bg-card border border-border flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20">
              {householdData.assessment_hh_id}
            </span>
            <span className="text-muted-foreground font-mono">EA: {householdData.ea_id}</span>
          </div>
          <div className="text-sm font-semibold text-foreground mt-1.5 flex items-center gap-2">
            <span className="text-primary font-mono text-xs font-bold">{sectionStepLabels[currentStep]}</span>
            <span className="text-muted-foreground">•</span>
            <span className="truncate">{sectionTitles[currentStep]}</span>
          </div>
        </div>

        {/* Autosave Status Pill */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {autosaveStatus === 'saving' && (
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500 animate-ping" />
              Autosaving...
            </span>
          )}
          {autosaveStatus === 'saved' && (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-3.5" />
              Draft saved locally
            </span>
          )}
          {autosaveStatus === 'offline' && (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <WifiOff className="size-3.5" />
              Offline
            </span>
          )}
        </div>
      </header>

      {/* Stepper Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>{sectionStepLabels[currentStep]}</span>
          <span>{progressPct}% Completed</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Main Step Renderers */}
      <main className="min-h-[420px] space-y-6">
        {/* Step 0: Section A (Grouped into clean cards) */}
        {currentStep === 0 && (
          <div className="space-y-6">
            {/* Card 1: EA & Household Identification */}
            <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-xs">
              <div className="border-b border-border pb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  {isHausa ? 'Gano Gida da Yanki' : '1. Household & Enumeration Area Identification'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirm study EA code, LGA, ward, and unique household assessment code.
                </p>
              </div>

              <div className="space-y-2">
                {sectionAGroup1.map(item => {
                  const shouldShow = item.showIf ? item.showIf(householdData) : true;
                  if (!shouldShow) return null;
                  return (
                    <QuestionRenderer
                      key={item.variable}
                      item={item}
                      value={householdData[item.variable]}
                      onChange={(val) => setHouseholdData({ ...householdData, [item.variable]: val })}
                      language={language}
                    />
                  );
                })}
              </div>
            </div>

            {/* Card 2: Interview Visit & Read-Aloud Consent */}
            <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-xs">
              <div className="border-b border-border pb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  {isHausa ? 'Ziyarar Bincike da Yarda' : '2. Interview Visit & Household Informed Consent'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Read aloud the informed consent script verbatim to the head of household or principal respondent.
                </p>
              </div>

              {/* Consent Script Box */}
              <aside aria-label="Household consent script" className="p-3.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground leading-relaxed italic">
                "{KASSEP_FORM_DEFINITION.sections[0].infoBlocks?.[0]}"
              </aside>

              <div className="space-y-2">
                {sectionAGroup2.map(item => {
                  const shouldShow = item.showIf ? item.showIf(householdData) : true;
                  if (!shouldShow) return null;
                  return (
                    <QuestionRenderer
                      key={item.variable}
                      item={item}
                      value={householdData[item.variable]}
                      onChange={(val) => setHouseholdData({ ...householdData, [item.variable]: val })}
                      language={language}
                    />
                  );
                })}
              </div>
            </div>

            {/* Card 3: Residence & Household Roster Count */}
            <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-xs">
              <div className="border-b border-border pb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  {isHausa ? 'Mazaunin Gida da Adadin Mata' : '3. Residence Status & Eligible Women Count'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Assess reference residence since August 1, 2024 and determine count of eligible female members.
                </p>
              </div>

              <div className="space-y-2">
                {sectionAGroup3.map(item => {
                  const shouldShow = item.showIf ? item.showIf(householdData) : true;
                  if (!shouldShow) return null;
                  return (
                    <QuestionRenderer
                      key={item.variable}
                      item={item}
                      value={householdData[item.variable]}
                      onChange={(val) => setHouseholdData({ ...householdData, [item.variable]: val })}
                      language={language}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Section B (Female Roster) */}
        {currentStep === 1 && (
          <SectionBRoster
            women={women}
            declaredCount={Number(householdData.hh_eligible_women || 0)}
            onUpdateWomen={setWomen}
            language={language}
          />
        )}

        {/* Step 2: Section C (Death Screen & Roster) */}
        {currentStep === 2 && (
          <SectionCDeath
            householdData={householdData}
            onUpdateHouseholdData={setHouseholdData}
            deaths={deaths}
            onUpdateDeaths={setDeaths}
            language={language}
          />
        )}

        {/* Step 3: Section D (Individual Woman Screening) */}
        {currentStep === 3 && currentWoman && (
          <div className="space-y-4">
            {/* Multiple Women Tabs */}
            {eligibleWomen.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {eligibleWomen.map((w, idx) => (
                  <button
                    key={w.woman_line}
                    type="button"
                    onClick={() => setActiveWomanIdx(idx)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-mono',
                      idx === activeWomanIdx
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    W{w.woman_line}: {w.data.woman_name}
                  </button>
                ))}
              </div>
            )}

            <SectionDScreening
              woman={currentWoman}
              onUpdateWomanData={(updatedData) => {
                const newWomen = [...women];
                const targetIdx = newWomen.findIndex(w => w.woman_line === currentWoman.woman_line);
                if (targetIdx !== -1) {
                  newWomen[targetIdx].data = updatedData;
                  setWomen(newWomen);
                }
              }}
              language={language}
            />
          </div>
        )}

        {/* Step 4: Section E (Pregnancy & Baby Loop) */}
        {currentStep === 4 && currentPreg && (
          <div className="space-y-4">
            {/* Multiple Pregnancy Episodes Tabs */}
            {womanPregs.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {womanPregs.map((p, idx) => (
                  <button
                    key={p.pregnancy_id}
                    type="button"
                    onClick={() => setActivePregIdx(idx)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-mono',
                      idx === activePregIdx
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Pregnancy #{p.episode_no}
                  </button>
                ))}
              </div>
            )}

            <SectionEPregnancy
              pregnancy={currentPreg}
              onUpdatePregnancyData={(updatedData) => {
                const newPregs = pregnancies.map(p =>
                  p.pregnancy_id === currentPreg.pregnancy_id
                    ? { ...p, data: updatedData }
                    : p
                );
                setPregnancies(newPregs);
              }}
              babies={currentBabies}
              onUpdateBabies={(updatedBabies) => {
                const otherBabies = babies.filter(b => b.pregnancy_id !== currentPreg.pregnancy_id);
                setBabies([...otherBabies, ...updatedBabies]);
              }}
              isDirectInterview={Number(currentWoman?.data?.response_type) === 1}
              womanName={currentWoman?.data?.woman_name || `Woman #${currentPreg.woman_line}`}
              language={language}
            />
          </div>
        )}

        {/* Step 5: Section F (Closure & Referrals) */}
        {currentStep === 5 && (
          <SectionFClosure
            householdData={householdData}
            onUpdateHouseholdData={setHouseholdData}
            referralIds={currentReferralIds}
            onAddAnotherPregnancy={() => {
              const womanLine = eligibleWomen[0]?.woman_line || 1;
              const nextEpisode = pregnancies.length + 1;
              const newPreg = {
                pregnancy_id: `${householdData.assessment_hh_id}-W${womanLine}-P${nextEpisode}`,
                woman_line: womanLine,
                episode_no: nextEpisode,
                data: {
                  pregnancy_id: `${householdData.assessment_hh_id}-W${womanLine}-P${nextEpisode}`,
                  outcome_type: 1,
                  babies_number: 1
                }
              };
              setPregnancies([...pregnancies, newPreg]);
              setActivePregIdx(pregnancies.length);
              setCurrentStep(4);
            }}
            language={language}
          />
        )}

        {/* Step 6: Review & Final Submission Screen */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <header className="p-5 rounded-xl bg-card border border-border shadow-xs">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <ClipboardCheck className="size-4 text-primary" />
                {isHausa ? 'Duba da Tabbatar da Bayanan Bincike' : 'Comprehensive Survey Review & Quality Verification'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verify all counts, parental link keys, and auto-referrals before submitting to supervisor review queue.
              </p>
            </header>

            {/* Section A Summary Card */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-2 text-xs">
                <span className="font-semibold text-foreground">Section A — Household Identification</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">Consent Verified</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block text-[10px]">HH ID</span>
                  <span className="font-semibold text-primary">{householdData.assessment_hh_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">EA Code</span>
                  <span className="text-foreground">{householdData.ea_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Date</span>
                  <span className="text-foreground">{householdData.interview_date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Declared Women</span>
                  <span className="text-foreground">{householdData.hh_eligible_women || 0}</span>
                </div>
              </div>
            </div>

            {/* Section B & C Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
                <div className="text-xs font-semibold text-foreground border-b border-border pb-1.5 flex items-center justify-between">
                  <span>Section B — Female Roster</span>
                  <span className="font-mono text-primary">{women.length}</span>
                </div>
                <div className="space-y-1 text-xs">
                  {women.length > 0 ? (
                    women.map((w) => (
                      <div key={w.woman_line} className="flex justify-between font-mono text-[11px]">
                        <span>W{w.woman_line}: {w.data.woman_name}</span>
                        <span className="text-muted-foreground">{w.data.woman_age} yrs</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic text-[11px]">No eligible women rostered</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
                <div className="text-xs font-semibold text-foreground border-b border-border pb-1.5 flex items-center justify-between">
                  <span>Section C — Deaths</span>
                  <span className="font-mono text-primary">{deaths.length}</span>
                </div>
                <div className="space-y-1 text-xs">
                  {deaths.length > 0 ? (
                    deaths.map((d) => (
                      <div key={d.death_line} className="flex justify-between font-mono text-[11px]">
                        <span>D{d.death_line}: {d.data.deceased_name}</span>
                        <span className="text-muted-foreground">{d.data.death_age_years} yrs</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic text-[11px]">No deaths reported in past 12 mos</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section D & E Summary Card */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
              <div className="text-xs font-semibold text-foreground border-b border-border pb-1.5 flex items-center justify-between">
                <span>Section D & E — Pregnancy Episodes & Babies</span>
                <span className="font-mono text-primary">{pregnancies.length} Episodes / {babies.length} Babies</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Pregnancy Episodes</span>
                  <span className="font-semibold text-foreground">{pregnancies.length} recorded</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Babies Documented</span>
                  <span className="font-semibold text-foreground">{babies.length} vital signs checked</span>
                </div>
              </div>
            </div>

            {/* Section F / Referral Banner */}
            {currentReferralIds.length > 0 && (
              <aside aria-label="Flagged referral cases" className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
                <div className="text-xs font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="size-4" />
                  {currentReferralIds.length} ACTIVE SURVEILLANCE REFERRAL(S) TRIGGERED
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentReferralIds.map(id => (
                    <span key={id} className="font-mono text-xs px-2 py-0.5 rounded-md bg-destructive text-destructive-foreground font-semibold">
                      {id}
                    </span>
                  ))}
                </div>
              </aside>
            )}

            {/* Submit CTA */}
            <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(5)}
                className="w-full sm:w-auto"
              >
                Back to Section F
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="font-semibold px-6 w-full sm:w-auto"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Household Assessment'}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Wizard Sticky Footer Controls */}
      {currentStep < 6 && (
        <footer className="sticky bottom-0 z-20 -mx-4 -mb-6 px-4 py-3 border-t border-border bg-background/95 backdrop-blur flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="text-xs"
          >
            <ChevronLeft className="size-4 mr-1" />
            {isHausa ? 'Baya' : 'Back'}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="text-xs font-semibold px-5 h-10 gap-1.5"
          >
            <span>{currentStep === 5 ? (isHausa ? 'Duba Kafin Aika' : 'Review & Verify') : (isHausa ? 'Na Gaba' : 'Next Section')}</span>
            <ChevronRight className="size-4" />
          </Button>
        </footer>
      )}
    </div>
  );
}
