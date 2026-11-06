"use client";

import React from 'react';
import { KASSEP_FORM_DEFINITION } from '@/lib/survey/form-definition';
import { QuestionRenderer } from './question-renderer';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SectionFClosureProps {
  householdData: Record<string, any>;
  onUpdateHouseholdData: (data: Record<string, any>) => void;
  referralIds: string[];
  onAddAnotherPregnancy: () => void;
  language: 'en' | 'ha';
}

export function SectionFClosure({
  householdData,
  onUpdateHouseholdData,
  referralIds,
  onAddAnotherPregnancy,
  language
}: SectionFClosureProps) {
  const isHausa = language === 'ha';
  const fDef = KASSEP_FORM_DEFINITION.sections.find(s => s.code === 'F')!;

  const handleChange = (variable: string, val: any) => {
    onUpdateHouseholdData({
      ...householdData,
      [variable]: val
    });

    if (variable === 'history_check' && Number(val) === 0) {
      onAddAnotherPregnancy();
    }
  };

  return (
    <div className="space-y-5">
      {/* Referral Cases Alert Box */}
      {referralIds.length > 0 ? (
        <aside aria-label="Surveillance verification referrals" className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
          <div className="flex items-center gap-2 text-destructive font-semibold text-xs uppercase tracking-wider">
            <AlertTriangle className="size-4 text-destructive" />
            {isHausa ? 'An Gano Abubuwan Da Ke Bukatar Tantancewa (Referrals)' : 'Cases Requiring Mortality / Stillbirth Verification'}
          </div>
          <p className="text-xs text-foreground">
            {isHausa
              ? 'Wadannan shaidu an tura su ta atomatik zuwa kwamitin tantancewa:'
              : 'The following auto-referral IDs have been linked for confidential surveillance verification:'}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {referralIds.map((refId) => (
              <span
                key={refId}
                className="font-mono text-xs px-2.5 py-1 rounded-md bg-destructive text-destructive-foreground font-semibold"
              >
                {refId}
              </span>
            ))}
          </div>
        </aside>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>No acute mortality or stillbirth referral flags triggered for this household.</span>
        </div>
      )}

      {/* Closure Questions */}
      <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-xs">
        <div className="border-b border-border pb-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            {isHausa ? 'Sashe F — Kammalawa da Shawara' : 'Section F — Interview Closure & Verification'}
          </h4>
        </div>

        <div className="space-y-3">
          {fDef.items.map(item => {
            let currentVal = householdData[item.variable];
            if (item.variable === 'referral_ids') {
              currentVal = referralIds.join(', ') || 'None';
            }

            return (
              <QuestionRenderer
                key={item.variable}
                item={item}
                value={currentVal}
                onChange={(val) => handleChange(item.variable, val)}
                language={language}
                readOnly={item.readOnly}
              />
            );
          })}
        </div>
      </div>

      {/* Thank you note */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed italic">
        "Thank respondents for their time and contribution to community health in Kano State. Obtain separate consent for clinical mortality verification rather than assuming this household interview covers it."
      </div>
    </div>
  );
}
