"use client";

import React, { useState } from 'react';
import {
  FileText,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Calendar,
  Users,
  Baby,
  Home,
  HeartPulse,
  Info,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FieldGuideViewProps {
  language: 'en' | 'ha';
}

export function FieldGuideView({ language }: FieldGuideViewProps) {
  const [activeTab, setActiveTab] = useState<'instructions' | 'codes' | 'structure'>('instructions');
  const isHausa = language === 'ha';

  const generalCodes = [
    {
      code: '1',
      labelEn: 'Yes',
      labelHa: 'E (Eh)',
      meaning: 'Affirmative response confirming the condition or occurrence.',
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
    },
    {
      code: '0',
      labelEn: 'No',
      labelHa: "A'a",
      meaning: 'Negative response confirming non-occurrence. Distinct from unknown or declined.',
      color: 'bg-muted text-muted-foreground border-border'
    },
    {
      code: '8',
      labelEn: 'Do not know',
      labelHa: 'Ban sani ba',
      meaning: 'Respondent does not know the answer. Never guess or substitute a default value.',
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
    },
    {
      code: '9',
      labelEn: 'Declined',
      labelHa: 'An ƙi amsawa',
      meaning: 'Respondent specifically declined or refused to answer this sensitive question.',
      color: 'bg-destructive/10 text-destructive border-destructive/20'
    }
  ];

  const interviewerInstructions = [
    {
      num: 1,
      titleEn: 'Approved Sampling Protocol Only',
      titleHa: 'Kula da Dokokin Zaɓen Gidaje',
      descEn: 'Interview only households selected through the approved sampling procedure. Do not replace absent or refusing households without supervisor authorisation under the sampling protocol.',
      descHa: 'A yi hira kawai da gidajen da aka zaɓa ta hanyar da aka amince da ita. Kada a canza gidan da ba a samu ba ko suka ƙi yarda ba tare da izinin shugaban bincike (supervisor) ba.'
    },
    {
      num: 2,
      titleEn: 'Order of Administration',
      titleHa: 'Tsarin Gudanar da Tambayoyi',
      descEn: 'Complete household identification, consent and the female roster before conducting individual pregnancy interviews.',
      descHa: 'Kammala bayanan gida, neman izini (consent), da jerin mata (female roster) kafin fara tambayoyin ciki ga kowace mace daban.'
    },
    {
      num: 3,
      titleEn: 'Universal Eligibility of Women',
      titleHa: 'Shigar da Duk Matan da Suka Cancanta',
      descEn: 'Include eligible women regardless of marital status, relationship to the household head or known pregnancy history.',
      descHa: 'A sanya duk matan da suka cancanta ba tare da la\'akari da ko suna da aure, dangantakarsu da mai gida, ko an san sun taɓa yin ciki ba.'
    },
    {
      num: 4,
      titleEn: 'Include Deceased & Relocated Residents',
      titleHa: 'Hada Matan da Suka Rasu ko Suka Tashi',
      descEn: 'Include women who died or moved away after living in the household during the reference period (1 August 2024 – 31 July 2026).',
      descHa: 'A haɗa matan da suka rasu ko suka ƙaura bayan sun zauna a gidan a cikin tsawon lokacin binciken (1 Agusta 2024 – 31 Yuli 2026).'
    },
    {
      num: 5,
      titleEn: 'Direct and Private Interviews',
      titleHa: 'Hira kai-tsaye a Keɓe',
      descEn: 'Interview women directly and privately wherever possible. Arrange a revisit before using a proxy for an unavailable woman, where feasible.',
      descHa: 'A zanta da kowace mace kai-tsaye a keɓe gwargwadon iyawa. A shirya sake komawa kafin a yi amfani da wakili (proxy) idan ba a samu mace ba.'
    },
    {
      num: 6,
      titleEn: 'Confidentiality in Group Settings',
      titleHa: 'Kiyaye Sirri a Gaban Jama\'a',
      descEn: 'Do not ask a household respondent to disclose another woman’s pregnancy history in a group setting.',
      descHa: 'Kada a tambayi mai amsa a gaban jama\'a game da tarihin cikin wata matar.'
    },
    {
      num: 7,
      titleEn: 'Response Categories Protocol',
      titleHa: 'Kada a Karanta Zaɓuɓɓuka',
      descEn: 'Do not read response categories aloud to the respondent unless explicitly instructed in the question prompt.',
      descHa: 'Kada a karanta zaɓuɓɓukan amsa a bayyane ga mai amsa sai dai idan akwai umarni a kan tambayar.'
    },
    {
      num: 8,
      titleEn: 'Exact Dates & Missing Data Precision',
      titleHa: 'Daidaiton Kwanan Wata da Rashin Sani',
      descEn: 'Record "do not know" rather than guessing. Never invent dates. Never substitute the 1st day of a month for month/year-only responses.',
      descHa: 'Rubuta "ban sani ba" maimakon ƙage. Kada a ƙirƙiro kwanan wata. Kada a sanya ranar 1 ga wata idan wata da shekara kawai aka sani.'
    },
    {
      num: 9,
      titleEn: 'Respondent Distress Protocol',
      titleHa: 'Kula da Damuwar Mai Amsa',
      descEn: 'Pause or stop the interview immediately if a respondent becomes distressed, emotional, or requests a pause.',
      descHa: 'A dakata ko a tsayar da hirar nan take idan mai amsa ta shiga damuwa, kuka, ko ta nemi a dakata.'
    },
    {
      num: 10,
      titleEn: 'Minor Consent & Assent Procedures',
      titleHa: 'Izinin Yara da Matasa',
      descEn: 'Apply approved parental/guardian consent and minor assent procedures for participants below the legal age of independent consent.',
      descHa: 'A bi tsarin neman izini daga iyaye ko magada tare da amincewar matashiya ga duk wacce ba ta kai shekarun cin gashin kanta ba.'
    },
    {
      num: 11,
      titleEn: 'Definition of a Household',
      titleHa: 'Ma\'anar Gida a Wannan Bincike',
      descEn: 'A household is defined as a group of people that share a living space and eat from the same cooking pot.',
      descHa: 'Gida a wannan bincike yana nufin mutanen da ke zaune a wuri ɗaya kuma suke cin abinci daga tukunya ɗaya.'
    }
  ];

  const surveySections = [
    {
      code: 'Section A',
      title: 'Household Identification & Consent',
      haTitle: 'Bayanan Gida da Neman Izini',
      level: 'Level 1: Household',
      items: 21,
      desc: 'EA code, GPS, community, household head, consent (A14), and total female count (A21).'
    },
    {
      code: 'Section B',
      title: 'Focused Female Roster',
      haTitle: 'Jerin Matan da Ke Gidan',
      level: 'Level 2: Woman',
      items: 12,
      desc: 'Line number, full name, age, residence status, and reference age eligibility (15–49).'
    },
    {
      code: 'Section C1 & C2',
      title: 'Household Death Screen & Mortality Roster',
      haTitle: 'Tantance Rasuwa da Jerin Mamata',
      level: 'Level 1 & Level 2',
      items: 10,
      desc: 'Deaths during reference period, age, sex, and maternal mortality screening (C08–C10).'
    },
    {
      code: 'Section D1 & D2',
      title: 'Individual Consent & Pregnancy Screening',
      haTitle: 'Izinin Mace da Tantance Ciki',
      level: 'Level 2: Woman',
      items: 10,
      desc: 'Direct vs proxy status, private consent, lifetime pregnancy screening, and reference period episodes (D10).'
    },
    {
      code: 'Section E1–E4',
      title: 'Pregnancy Episodes, Births & Outcomes',
      haTitle: 'Tarihin Ciki, Haihuwa da Sakamako',
      level: 'Level 3 & Level 4',
      items: 25,
      desc: 'Gestational age, outcome type (birth/loss), baby vital signs, survival, stillbirth verification, and KASSEP notification.'
    },
    {
      code: 'Section F',
      title: 'Closure, Linked Referrals & Observations',
      haTitle: 'Rufe Bincike, Manazarta da Bayanin Mai Tambaya',
      level: 'Level 1: Household',
      items: 4,
      desc: 'Loop control back to Section E (F01), auto-generated referral tracking IDs (F02), and final interview result.'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                {isHausa ? 'Jagoran Binciken KASSEP na Filin Aiki' : 'KASSEP Field Interviewer Protocol & Reference Guide'}
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                Doctors Medical Aid Foundation (DMAF) • Kano State Internal Validation Assessment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono font-medium">
              <Calendar className="size-3" />
              1 Aug 2024 – 31 Jul 2026
            </span>
          </div>
        </div>

        {/* Reference Period Context Pill */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-border text-xs">
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
            <span className="font-semibold text-foreground block">Reference Scope:</span>
            <span className="text-muted-foreground text-[11px]">
              Independent assessment of pregnancies, live births, stillbirths, and maternal deaths across ~140 EAs.
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
            <span className="font-semibold text-foreground block">Phase 1:</span>
            <span className="text-muted-foreground text-[11px] font-mono">
              1 August 2024 – 31 July 2025
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
            <span className="font-semibold text-foreground block">Phase 2:</span>
            <span className="text-muted-foreground text-[11px] font-mono">
              1 August 2025 – 31 July 2026
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-medium">
        <Button
          variant={activeTab === 'instructions' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('instructions')}
          className="gap-1.5"
        >
          <FileText className="size-3.5" />
          <span>{isHausa ? 'Dokokin Masu Tambayoyi' : 'Interviewer Instructions'}</span>
        </Button>

        <Button
          variant={activeTab === 'codes' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('codes')}
          className="gap-1.5 font-mono"
        >
          <HelpCircle className="size-3.5" />
          <span>{isHausa ? 'Standard Lambobin Amsa' : 'Standard Response Codes'}</span>
        </Button>

        <Button
          variant={activeTab === 'structure' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('structure')}
          className="gap-1.5"
        >
          <Home className="size-3.5" />
          <span>{isHausa ? 'Tsarin Tambayoyi (Sections)' : 'Questionnaire Structure'}</span>
        </Button>
      </div>

      {/* TAB 1: Interviewer Instructions */}
      {activeTab === 'instructions' && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-mono">
            {isHausa
              ? 'Ka\'idojin gudanar da bincike guda 11 daga littafin jagora na KASSEP:'
              : 'The 11 core field instructions extracted directly from the Cover & Index protocol specifications:'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {interviewerInstructions.map((item) => (
              <div
                key={item.num}
                className="p-3.5 rounded-xl bg-card border border-border shadow-xs flex gap-3 hover:border-primary/40 transition-colors"
              >
                <div className="size-6 rounded-full bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {item.num}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground">
                    {isHausa ? item.titleHa : item.titleEn}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isHausa ? item.descHa : item.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Standard Response Codes */}
      {activeTab === 'codes' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Info className="size-4 text-primary" />
              General Coding Protocol (Cover & Index Sheet)
            </span>
            <p className="text-[11px] text-muted-foreground">
              Always preserve <strong className="text-foreground">8 (Do not know)</strong> and{' '}
              <strong className="text-foreground">9 (Declined)</strong> as distinct from{' '}
              <strong className="text-foreground">0 (No)</strong>. Numeric counts and calendar dates must
              have separate missing-response flags. Never default or substitute values.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {generalCodes.map((c) => (
              <div
                key={c.code}
                className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'size-8 rounded-lg font-mono font-bold text-sm flex items-center justify-center border',
                      c.color
                    )}
                  >
                    {c.code}
                  </span>
                  <span className="font-semibold text-xs text-foreground font-mono">
                    {c.labelEn} / {c.labelHa}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {c.meaning}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-xs text-xs space-y-2">
            <h4 className="font-semibold text-foreground">Critical Data Quality Rules:</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-[11px]">
              <li>
                <strong>Date Imputation Prohibited:</strong> If only the month and year of a birth, pregnancy outcome, or death are known, record month/year precision. Never substitute day 1.
              </li>
              <li>
                <strong>No Hard Time Blocks:</strong> Do not impose rigid 6, 10, or 12 month hard blocks between pregnancy episodes. Flag short intervals for supervisor review.
              </li>
              <li>
                <strong>Multiple Gestations:</strong> Each baby born in a multiple pregnancy (twins, triplets) receives a separate baby record in Section E2 to independently capture vital status.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: Questionnaire Structure */}
      {activeTab === 'structure' && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-mono">
            6 Core Questionnaire Sections matching the official KASSEP survey instruments:
          </div>

          <div className="space-y-2.5">
            {surveySections.map((sec) => (
              <div
                key={sec.code}
                className="p-4 rounded-xl bg-card border border-border shadow-xs hover:border-primary/40 transition-colors space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {sec.code}
                    </span>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                      {isHausa ? sec.haTitle : sec.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {sec.level} • {sec.items} items
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {sec.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

