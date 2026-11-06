"use client";

import React from 'react';
import { SurveyItem, FlexibleDateValue, NumberUnitValue } from '@/types/survey';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Lock, Calendar, Hash, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionRendererProps {
  item: SurveyItem;
  value: any;
  onChange: (value: any) => void;
  language: 'en' | 'ha';
  readOnly?: boolean;
}

export function QuestionRenderer({
  item,
  value,
  onChange,
  language,
  readOnly = false
}: QuestionRendererProps) {
  const isHausa = language === 'ha';
  const label = (isHausa && item.haLabel) ? item.haLabel : item.label;
  const instructions = (isHausa && item.haInstructions) ? item.haInstructions : item.instructions;

  // Render Info Block
  if (item.type === 'info_block') {
    return (
      <aside aria-label="Interviewer instructions" className="p-4 my-2 rounded-xl bg-primary/10 border border-primary/20 text-foreground text-xs leading-relaxed">
        <div className="font-semibold text-xs text-primary mb-1 flex items-center gap-1.5">
          <HelpCircle className="size-3.5" />
          {isHausa ? 'UMARNIN MAI BINCIKE / YARDAR GIDA' : 'INTERVIEWER INSTRUCTION / SCRIPT'}
        </div>
        <div className="italic text-muted-foreground">{label}</div>
      </aside>
    );
  }

  return (
    <div className="space-y-2.5 py-3.5 border-b border-border/70 last:border-b-0">
      {/* Label & Variable Badge */}
      <div className="flex items-start justify-between gap-2">
        <label className="text-sm font-medium text-foreground flex-1 leading-snug">
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border mr-1.5 font-semibold">
            {item.no}
          </span>
          {label}
          {item.required && <span className="text-destructive ml-1">*</span>}
          {item.restricted && (
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-mono">
              <Lock className="size-2.5" />
              {isHausa ? 'Sirri (PII)' : 'Restricted PII'}
            </span>
          )}
        </label>
      </div>

      {/* Instructions */}
      {instructions && (
        <p className="text-xs text-muted-foreground italic pl-1 leading-normal">{instructions}</p>
      )}

      {/* Input Controls */}
      <div className="pt-1">
        {/* 1. Yes / No / DK / Declined */}
        {item.type === 'yes_no_dk_declined' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                code: 1,
                label: isHausa ? '1 - I (Eh)' : '1 - Yes',
                selectedClass: 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/30',
                defaultClass: 'hover:border-emerald-500/50 hover:bg-emerald-500/5'
              },
              {
                code: 0,
                label: isHausa ? '0 - A\'a' : '0 - No',
                selectedClass: 'border-foreground bg-muted text-foreground font-semibold ring-1 ring-border',
                defaultClass: 'hover:border-border hover:bg-muted/50'
              },
              {
                code: 8,
                label: isHausa ? '8 - Ban sani ba' : '8 - Do not know',
                selectedClass: 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold ring-1 ring-amber-500/30',
                defaultClass: 'hover:border-amber-500/50 hover:bg-amber-500/5'
              },
              {
                code: 9,
                label: isHausa ? '9 - An ƙi' : '9 - Declined',
                selectedClass: 'border-destructive bg-destructive/15 text-destructive font-semibold ring-1 ring-destructive/30',
                defaultClass: 'hover:border-destructive/50 hover:bg-destructive/5'
              }
            ].map(opt => {
              const isSelected = Number(value) === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onChange(opt.code)}
                  className={cn(
                    'min-h-[44px] px-3 py-2 rounded-lg border text-xs text-center transition-all bg-card text-foreground',
                    isSelected ? opt.selectedClass : cn('border-border text-muted-foreground', opt.defaultClass)
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Single Choice (Large Option Buttons or Select) */}
        {item.type === 'single_choice' && item.options && (
          <div className="space-y-1.5">
            {item.options.length <= 6 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.options.map(opt => {
                  const isSelected = String(value) === String(opt.code);
                  return (
                    <button
                      key={String(opt.code)}
                      type="button"
                      disabled={readOnly}
                      onClick={() => onChange(opt.code)}
                      className={cn(
                        'min-h-[44px] px-3 py-2.5 rounded-lg border text-xs text-left transition-all flex items-center justify-between bg-card',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/20'
                          : 'border-border text-foreground hover:bg-muted/50'
                      )}
                    >
                      <span className="leading-snug">{(isHausa && opt.haLabel) ? opt.haLabel : opt.label}</span>
                      {isSelected && <span className="size-2 rounded-full bg-primary shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <select
                disabled={readOnly}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- {isHausa ? 'Zabi daya' : 'Select an option'} --</option>
                {item.options.map(opt => (
                  <option key={String(opt.code)} value={opt.code}>
                    {(isHausa && opt.haLabel) ? opt.haLabel : opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* 3. Multi Choice */}
        {item.type === 'multi_choice' && item.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {item.options.map(opt => {
              const currentArr: string[] = Array.isArray(value) ? value : [];
              const isChecked = currentArr.includes(String(opt.code));

              const toggle = () => {
                if (readOnly) return;
                if (isChecked) {
                  onChange(currentArr.filter(c => c !== String(opt.code)));
                } else {
                  onChange([...currentArr, String(opt.code)]);
                }
              };

              return (
                <button
                  key={String(opt.code)}
                  type="button"
                  onClick={toggle}
                  className={cn(
                    'min-h-[44px] px-3 py-2 rounded-lg border text-xs text-left transition-all flex items-center gap-2.5 bg-card',
                    isChecked
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border text-foreground hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'size-4 rounded border flex items-center justify-center shrink-0',
                    isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background'
                  )}>
                    {isChecked && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="leading-snug">{(isHausa && opt.haLabel) ? opt.haLabel : opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 4. Flexible Date */}
        {item.type === 'flexible_date' && (
          <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              {(['exact', 'month_year', 'approximate', 'unknown'] as const).map(precision => {
                const currentPrecision = value?.precision || 'exact';
                const isSelected = currentPrecision === precision;
                const labels: Record<string, string> = {
                  exact: isHausa ? 'Cikakken Kwanan Wata' : 'Exact Date',
                  month_year: isHausa ? 'Wata da Shekara' : 'Month / Year',
                  approximate: isHausa ? 'Kimanin Lokaci' : 'Approximate',
                  unknown: isHausa ? 'Ba a sani ba' : 'Unknown'
                };

                return (
                  <button
                    key={precision}
                    type="button"
                    disabled={readOnly}
                    onClick={() => onChange({ ...value, precision })}
                    className={cn(
                      'px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {labels[precision]}
                  </button>
                );
              })}
            </div>

            {/* Precision Renderers */}
            {(!value?.precision || value.precision === 'exact') && (
              <Input
                type="date"
                disabled={readOnly}
                value={value?.date || ''}
                onChange={(e) => onChange({ ...value, precision: 'exact', date: e.target.value })}
                className="h-11 bg-background border-border text-xs text-foreground w-full sm:w-64"
              />
            )}

            {value?.precision === 'month_year' && (
              <div className="flex items-center gap-2">
                <select
                  disabled={readOnly}
                  value={value?.month || ''}
                  onChange={(e) => onChange({ ...value, precision: 'month_year', month: Number(e.target.value) })}
                  className="h-11 px-3 bg-background border border-border rounded-lg text-xs text-foreground"
                >
                  <option value="">-- Month --</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                    <option key={m} value={i + 1}>{i + 1} - {m}</option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder="Year (e.g. 2025)"
                  disabled={readOnly}
                  value={value?.year || ''}
                  onChange={(e) => onChange({ ...value, precision: 'month_year', year: Number(e.target.value) })}
                  className="h-11 w-36 bg-background border-border text-xs text-foreground"
                />
              </div>
            )}

            {value?.precision === 'approximate' && (
              <Input
                type="text"
                placeholder={isHausa ? 'Misali: Lokacin damina 2025' : 'e.g., Rainy season 2025 / late last year'}
                disabled={readOnly}
                value={value?.approxText || ''}
                onChange={(e) => onChange({ ...value, precision: 'approximate', approxText: e.target.value })}
                className="h-11 bg-background border-border text-xs text-foreground"
              />
            )}

            {value?.precision === 'unknown' && (
              <div className="text-xs text-amber-700 dark:text-amber-400 italic">
                {isHausa ? 'An rubuta a matsayin ba a sani ba (Za a kiyaye a asirce)' : 'Recorded as unknown date (Preserved distinctly from arbitrary dates)'}
              </div>
            )}
          </div>
        )}

        {/* 5. Number + Unit */}
        {item.type === 'number_unit' && (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              placeholder="0"
              disabled={readOnly || value?.isUnknown || value?.isDeclined}
              value={value?.value ?? ''}
              onChange={(e) => onChange({ ...value, value: e.target.value === '' ? undefined : Number(e.target.value) })}
              className="h-11 w-28 bg-background border-border text-xs text-foreground"
            />
            {item.unitOptions && (
              <select
                disabled={readOnly || value?.isUnknown || value?.isDeclined}
                value={value?.unit || item.unitOptions[0]}
                onChange={(e) => onChange({ ...value, unit: e.target.value })}
                className="h-11 px-3 bg-background border border-border rounded-lg text-xs text-foreground"
              >
                {item.unitOptions.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              disabled={readOnly}
              onClick={() => onChange({ isUnknown: !value?.isUnknown, value: undefined })}
              className={cn(
                'min-h-[44px] px-3 py-2 rounded-lg text-xs border transition-all',
                value?.isUnknown
                  ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              )}
            >
              {isHausa ? 'Ba a sani ba' : 'Unknown'}
            </button>
          </div>
        )}

        {/* 6. Standard Integer */}
        {item.type === 'integer' && (
          <Input
            type="number"
            disabled={readOnly}
            placeholder="0"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            className="h-11 w-36 bg-background border-border text-xs text-foreground focus-visible:ring-primary"
          />
        )}

        {/* 7. Text Input */}
        {item.type === 'text' && (
          <Input
            type="text"
            disabled={readOnly}
            placeholder={item.restricted ? (isHausa ? 'Bayanin sirri' : 'Restricted confidential info') : ''}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 bg-background border-border text-xs text-foreground focus-visible:ring-primary"
          />
        )}

        {/* 8. Long Text */}
        {item.type === 'long_text' && (
          <textarea
            disabled={readOnly}
            rows={3}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isHausa ? 'Rubuta karin bayani a nan...' : 'Enter details here...'}
            className="w-full p-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        )}

        {/* 9. Auto Field */}
        {item.type === 'auto_field' && (
          <div className="h-11 px-3 rounded-lg bg-muted/40 border border-border flex items-center text-xs font-mono text-primary font-medium">
            {value || '(Auto-assigned)'}
          </div>
        )}
      </div>
    </div>
  );
}
