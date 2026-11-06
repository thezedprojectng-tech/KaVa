"use client";

import React from 'react';
import { KASSEP_FORM_DEFINITION } from '@/lib/survey/form-definition';
import { QuestionRenderer } from './question-renderer';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck, AlertCircle } from 'lucide-react';

interface SectionDScreeningProps {
  woman: { woman_line: number; data: Record<string, any> };
  onUpdateWomanData: (data: Record<string, any>) => void;
  language: 'en' | 'ha';
}

export function SectionDScreening({
  woman,
  onUpdateWomanData,
  language
}: SectionDScreeningProps) {
  const isHausa = language === 'ha';
  const d1Def = KASSEP_FORM_DEFINITION.sections.find(s => s.code === 'D1')!;
  const d1ConsentDef = KASSEP_FORM_DEFINITION.sections.find(s => s.code === 'D1_Consent')!;
  const d2Def = KASSEP_FORM_DEFINITION.sections.find(s => s.code === 'D2')!;

  const data = woman.data;
  const womanName = data.woman_name || `Woman Line #${woman.woman_line}`;

  const handleChange = (variable: string, val: any) => {
    onUpdateWomanData({
      ...data,
      [variable]: val
    });
  };

  const consentGiven = Number(data.individual_consent) === 1;

  return (
    <div className="space-y-5">
      {/* Woman Banner */}
      <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-mono">
            W{woman.woman_line}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{womanName}</h3>
            <p className="text-xs text-muted-foreground font-mono">
              {data.woman_age ? `${data.woman_age} years old` : 'Age unknown'} • Line #{woman.woman_line}
            </p>
          </div>
        </div>

        <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border">
          {data.response_type === 1 ? 'Direct Interview' : 'Proxy Interview'}
        </span>
      </div>

      {/* D1: Interview Type & Consent */}
      <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-xs">
        <div className="border-b border-border pb-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            {isHausa ? 'Sashe D1: Nau\'in Tattaunawa da Yarda' : 'Section D1: Interview Type & Individual Consent'}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Confirm whether respondent is answering directly or by proxy, and read individual consent text.
          </p>
        </div>

        <div className="space-y-3">
          {d1Def.items.map(item => {
            const shouldShow = item.showIf ? item.showIf(data) : true;
            if (!shouldShow) return null;

            return (
              <QuestionRenderer
                key={item.variable}
                item={item}
                value={data[item.variable]}
                onChange={(val) => handleChange(item.variable, val)}
                language={language}
              />
            );
          })}
        </div>
      </div>

      {/* D2: Pregnancy Screening (Only if consentGiven) */}
      {consentGiven && (
        <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-xs">
          <div className="border-b border-border pb-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="size-4 text-primary" />
              {isHausa ? 'Sashe D2: Binciken Tarihin Ciki a Lokacin KASSEP' : 'Section D2: Pregnancy Episode Screening (Reference Window)'}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Screen for any pregnancies ended or ongoing since August 1, 2024 (Phase 1 & 2 overlap).
            </p>
          </div>

          <div className="space-y-3">
            {d2Def.items.map(item => {
              const shouldShow = item.showIf ? item.showIf(data) : true;
              if (!shouldShow) return null;

              return (
                <QuestionRenderer
                  key={item.variable}
                  item={item}
                  value={data[item.variable]}
                  onChange={(val) => handleChange(item.variable, val)}
                  language={language}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
