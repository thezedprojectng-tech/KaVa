"use client";

import React, { useState } from 'react';
import { KASSEP_FORM_DEFINITION } from '@/lib/survey/form-definition';
import { QuestionRenderer } from './question-renderer';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Baby, HeartPulse, Activity, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionEPregnancyProps {
  pregnancy: {
    pregnancy_id: string;
    woman_line: number;
    episode_no: number;
    data: Record<string, any>;
  };
  onUpdatePregnancyData: (data: Record<string, any>) => void;
  babies: Array<{
    baby_id: number;
    pregnancy_id: string;
    woman_line: number;
    episode_no: number;
    data: Record<string, any>;
  }>;
  onUpdateBabies: (babies: Array<any>) => void;
  isDirectInterview: boolean; // D02 === 1
  womanName: string;
  language: 'en' | 'ha';
}

export function SectionEPregnancy({
  pregnancy,
  onUpdatePregnancyData,
  babies,
  onUpdateBabies,
  isDirectInterview,
  womanName,
  language
}: SectionEPregnancyProps) {
  const isHausa = language === 'ha';
  const e1Def = KASSEP_FORM_DEFINITION.sections.find(s => s.code === 'E1')!;
  const e2Def = KASSEP_FORM_DEFINITION.sections.find(s => s.code === 'E2')!;
  const e3Def = KASSEP_FORM_DEFINITION.sections.find(s => s.code === 'E3')!;
  const e4Def = KASSEP_FORM_DEFINITION.sections.find(s => s.code === 'E4')!;

  const pData = pregnancy.data;
  const outcomeType = Number(pData.outcome_type);
  const isBirth = outcomeType === 1;

  // Auto-fill E15 = 1 for living woman direct interview
  if (isDirectInterview && pData.maternal_status === undefined) {
    pData.maternal_status = 1;
  }

  const handlePregnancyChange = (variable: string, val: any) => {
    const updated = { ...pData, [variable]: val };

    // If outcome_type changed to birth and babies_number is set, synchronize baby records
    if (variable === 'babies_number' && Number(val) > 0) {
      const targetCount = Number(val);
      const currentBabies = [...babies];
      if (currentBabies.length < targetCount) {
        for (let i = currentBabies.length + 1; i <= targetCount; i++) {
          currentBabies.push({
            baby_id: i,
            pregnancy_id: pregnancy.pregnancy_id,
            woman_line: pregnancy.woman_line,
            episode_no: pregnancy.episode_no,
            data: { baby_id: i, baby_sex: 1, signs_life: 1, baby_alive: 1 }
          });
        }
        onUpdateBabies(currentBabies);
      }
    }

    onUpdatePregnancyData(updated);
  };

  const handleBabyChange = (babyId: number, variable: string, val: any) => {
    const updated = babies.map(b => {
      if (b.baby_id === babyId) {
        return {
          ...b,
          data: { ...b.data, [variable]: val }
        };
      }
      return b;
    });
    onUpdateBabies(updated);
  };

  const handleAddBabyManually = () => {
    const nextBabyId = babies.length + 1;
    const newBaby = {
      baby_id: nextBabyId,
      pregnancy_id: pregnancy.pregnancy_id,
      woman_line: pregnancy.woman_line,
      episode_no: pregnancy.episode_no,
      data: { baby_id: nextBabyId, baby_sex: 1, signs_life: 1, baby_alive: 1 }
    };
    onUpdateBabies([...babies, newBaby]);
    onUpdatePregnancyData({ ...pData, babies_number: nextBabyId });
  };

  const handleRemoveBaby = (babyId: number) => {
    const updated = babies.filter(b => b.baby_id !== babyId).map((b, idx) => ({
      ...b,
      baby_id: idx + 1,
      data: { ...b.data, baby_id: idx + 1 }
    }));
    onUpdateBabies(updated);
    onUpdatePregnancyData({ ...pData, babies_number: updated.length });
  };

  return (
    <div className="space-y-5">
      {/* Pregnancy Episode Header */}
      <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
            Episode #{pregnancy.episode_no} • {pregnancy.pregnancy_id}
          </span>
          <h3 className="text-sm font-semibold text-foreground mt-0.5">
            {womanName} — Pregnancy #{pregnancy.episode_no}
          </h3>
        </div>
      </div>

      {/* E1. Timing, Residence and Outcome */}
      <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-xs">
        <div className="border-b border-border pb-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <HeartPulse className="size-4 text-primary" />
            {isHausa ? 'Sashe E1 — Lokaci da Sakamakon Ciki' : 'Section E1 — Timing, Residence & Outcome'}
          </h4>
        </div>

        <div className="space-y-3">
          {e1Def.items.map(item => {
            if (item.variable === 'pregnancy_id') return null;
            const shouldShow = item.showIf ? item.showIf(pData) : true;
            if (!shouldShow) return null;

            return (
              <QuestionRenderer
                key={item.variable}
                item={item}
                value={pData[item.variable]}
                onChange={(val) => handlePregnancyChange(item.variable, val)}
                language={language}
              />
            );
          })}
        </div>
      </div>

      {/* E2. Baby Record (Only when E10 = 1 Birth) */}
      {isBirth && (
        <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Baby className="size-4 text-primary" />
                {isHausa ? 'Sashe E2 — Bayanin Jarirai' : 'Section E2 — Baby Record'}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isHausa
                  ? 'Rubuta kowane jaririn da aka haifa daga wannan cikin (da rai ko ba rai).'
                  : 'Record details for each baby born from this pregnancy (live birth or stillbirth).'}
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleAddBabyManually}
              className="text-xs gap-1 h-8"
            >
              <Plus className="size-3.5" />
              <span>{isHausa ? 'Ƙara Jariri' : 'Add Baby'}</span>
            </Button>
          </div>

          {babies.length > 0 ? (
            <div className="space-y-4">
              {babies.map((baby) => {
                const bData = baby.data;
                const isStillbornSuspect = Number(bData.signs_life) === 0 || Number(bData.signs_life) === 8;

                return (
                  <div
                    key={baby.baby_id}
                    className="p-4 rounded-xl bg-muted/30 border border-border space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20">
                          Baby #{baby.baby_id}
                        </span>
                        {isStillbornSuspect && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1 font-mono">
                            <AlertTriangle className="size-3" />
                            Stillbirth Review Triggered
                          </span>
                        )}
                      </div>

                      {babies.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveBaby(baby.baby_id)}
                          className="text-destructive hover:text-destructive"
                          title="Remove baby"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Baby questions E13a - E13h */}
                    <div className="space-y-3">
                      {e2Def.items.map(item => {
                        if (item.variable === 'baby_id') return null;
                        const shouldShow = item.showIf ? item.showIf(bData) : true;
                        if (!shouldShow) return null;

                        return (
                          <QuestionRenderer
                            key={item.variable}
                            item={item}
                            value={bData[item.variable]}
                            onChange={(val) => handleBabyChange(baby.baby_id, item.variable, val)}
                            language={language}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs">
              {isHausa
                ? 'Danna "Ƙara Jariri" don fara shigar da bayanan jarirai.'
                : 'Click "Add Baby" to record baby details.'}
            </div>
          )}
        </div>
      )}

      {/* E3. Maternal Survival */}
      <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-xs">
        <div className="border-b border-border pb-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <HeartPulse className="size-4 text-primary" />
            {isHausa ? 'Sashe E3 — Rayuwar Uwa' : 'Section E3 — Maternal Survival'}
          </h4>
        </div>

        {isDirectInterview ? (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <span>✓ Living woman direct interview: Maternal survival auto-recorded as alive (E15 = 1).</span>
          </div>
        ) : (
          <div className="space-y-3">
            {e3Def.items.map(item => {
              const shouldShow = item.showIf ? item.showIf(pData) : true;
              if (!shouldShow) return null;

              return (
                <QuestionRenderer
                  key={item.variable}
                  item={item}
                  value={pData[item.variable]}
                  onChange={(val) => handlePregnancyChange(item.variable, val)}
                  language={language}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* E4. Notification and Follow-up */}
      <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-xs">
        <div className="border-b border-border pb-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            {isHausa ? 'Sashe E4 — Sanarwa da Bibiya a Al\'umma' : 'Section E4 — Community Notification & Surveillance Follow-up'}
          </h4>
        </div>

        <div className="space-y-3">
          {e4Def.items.map(item => {
            const shouldShow = item.showIf ? item.showIf(pData) : true;
            if (!shouldShow) return null;

            return (
              <QuestionRenderer
                key={item.variable}
                item={item}
                value={pData[item.variable]}
                onChange={(val) => handlePregnancyChange(item.variable, val)}
                language={language}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
