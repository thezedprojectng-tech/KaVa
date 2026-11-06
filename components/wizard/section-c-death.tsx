"use client";

import React, { useState } from 'react';
import { KASSEP_FORM_DEFINITION } from '@/lib/survey/form-definition';
import { QuestionRenderer } from './question-renderer';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Edit2, AlertTriangle, UserMinus } from 'lucide-react';

interface SectionCDeathProps {
  householdData: Record<string, any>;
  onUpdateHouseholdData: (data: Record<string, any>) => void;
  deaths: Array<{ death_line: number; data: Record<string, any> }>;
  onUpdateDeaths: (deaths: Array<{ death_line: number; data: Record<string, any> }>) => void;
  language: 'en' | 'ha';
}

export function SectionCDeath({
  householdData,
  onUpdateHouseholdData,
  deaths,
  onUpdateDeaths,
  language
}: SectionCDeathProps) {
  const isHausa = language === 'ha';
  const c1Def = KASSEP_FORM_DEFINITION.sections.find(s => s.code === 'C1')!;
  const c2Def = KASSEP_FORM_DEFINITION.sections.find(s => s.code === 'C2')!;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentDeath, setCurrentDeath] = useState<Record<string, any>>({});

  const anyDeath = Number(householdData.any_death);

  const handleOpenAdd = () => {
    setCurrentDeath({
      death_line: deaths.length + 1,
      death_residence: 1,
      deceased_sex: 1
    });
    setEditingIndex(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    setCurrentDeath({ ...deaths[index].data, death_line: deaths[index].death_line });
    setEditingIndex(index);
    setModalOpen(true);
  };

  const handleSaveDeath = () => {
    if (!currentDeath.deceased_name) {
      alert(isHausa ? 'Da fatan a shigar da sunan mamacin.' : 'Please enter the deceased person\'s name.');
      return;
    }

    const updated = [...deaths];
    if (editingIndex !== null) {
      updated[editingIndex] = {
        death_line: updated[editingIndex].death_line,
        data: currentDeath
      };
    } else {
      updated.push({
        death_line: updated.length + 1,
        data: currentDeath
      });
    }

    onUpdateDeaths(updated);
    setModalOpen(false);
  };

  const handleDeleteDeath = (index: number) => {
    if (confirm(isHausa ? 'Shin kuna da tabbacin cire wannan rasuwar?' : 'Are you sure you want to remove this death record?')) {
      const updated = deaths.filter((_, i) => i !== index).map((d, idx) => ({
        death_line: idx + 1,
        data: { ...d.data, death_line: idx + 1 }
      }));
      onUpdateDeaths(updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section C1: Household Death Screening */}
      <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-xs">
        <div className="border-b border-border pb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserMinus className="size-4 text-primary" />
            {isHausa ? 'Sashe C1: Binciken Rasuwar Iyali' : 'Section C1: Household Death Screening (Past 12 Months)'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify all deaths in the household during the reference window (since August 1, 2024).
          </p>
        </div>

        <div className="space-y-3">
          {c1Def.items.map(item => (
            <QuestionRenderer
              key={item.variable}
              item={item}
              value={householdData[item.variable]}
              onChange={(val) => onUpdateHouseholdData({ ...householdData, [item.variable]: val })}
              language={language}
            />
          ))}
        </div>
      </div>

      {/* Section C2: Death Roster (Only if anyDeath === 1) */}
      {anyDeath === 1 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-border flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                {isHausa ? 'Jerin Mamata a Gidan' : 'Deceased Household Members Roster'}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {deaths.length} {deaths.length === 1 ? 'death' : 'deaths'} documented
              </p>
            </div>

            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="text-xs gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>{isHausa ? 'Ƙara Mamaci' : 'Add Deceased Person'}</span>
            </Button>
          </div>

          {deaths.length > 0 ? (
            <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-mono text-xs">#</TableHead>
                    <TableHead className="font-mono text-xs">{isHausa ? 'Suna (PII)' : 'Name (PII)'}</TableHead>
                    <TableHead className="font-mono text-xs">{isHausa ? 'Jinsi' : 'Sex'}</TableHead>
                    <TableHead className="font-mono text-xs">{isHausa ? 'Shekaru' : 'Age at Death'}</TableHead>
                    <TableHead className="font-mono text-xs">{isHausa ? 'Kwanan Wata' : 'Date of Death'}</TableHead>
                    <TableHead className="font-mono text-xs">{isHausa ? 'Alamun Ciki' : 'Repro Flags'}</TableHead>
                    <TableHead className="font-mono text-xs text-right">{isHausa ? 'Aiki' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deaths.map((d, index) => {
                    const data = d.data;
                    const isFemaleRepro = Number(data.deceased_sex) === 2 &&
                      Number(data.death_age_years) >= 12 && Number(data.death_age_years) <= 50;

                    return (
                      <TableRow key={index} className="hover:bg-muted/40">
                        <TableCell className="font-mono font-semibold text-primary text-xs">
                          D{d.death_line}
                        </TableCell>
                        <TableCell className="font-medium text-foreground text-xs">
                          {data.deceased_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {data.deceased_sex === 1 ? 'Male' : data.deceased_sex === 2 ? 'Female' : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {data.death_age_years ? `${data.death_age_years} yrs` : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {data.death_date?.date || '—'}
                        </TableCell>
                        <TableCell>
                          {isFemaleRepro ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                              <AlertTriangle className="size-2.5" /> Repro Age
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(index)}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleDeleteDeath(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 text-center rounded-xl border border-dashed border-border bg-card text-muted-foreground text-xs">
              {isHausa ? 'Babu wani mamaci da aka shigar tukuna. Danna "Ƙara Mamaci".' : 'No death records recorded yet. Click "Add Deceased Person" above.'}
            </div>
          )}
        </div>
      )}

      {/* Death Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <header className="border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground">
                {editingIndex !== null ? (isHausa ? 'Gyara Bayanin Mamaci' : 'Edit Deceased Person Record') : (isHausa ? 'Ƙara Sabon Mamaci' : 'Add Deceased Person')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Death Line #D{currentDeath.death_line || (deaths.length + 1)}
              </p>
            </header>

            <div className="space-y-3">
              {c2Def.items.map(item => {
                const shouldShow = item.showIf ? item.showIf(currentDeath) : true;
                if (!shouldShow) return null;

                return (
                  <QuestionRenderer
                    key={item.variable}
                    item={item}
                    value={currentDeath[item.variable]}
                    onChange={(val) => setCurrentDeath({ ...currentDeath, [item.variable]: val })}
                    language={language}
                  />
                );
              })}
            </div>

            <footer className="pt-3 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                {isHausa ? 'Soke' : 'Cancel'}
              </Button>
              <Button size="sm" onClick={handleSaveDeath}>
                {isHausa ? 'Ajiye Mamaci' : 'Save Death Record'}
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
