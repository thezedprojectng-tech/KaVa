"use client";

import React, { useState } from 'react';
import { SurveyItem } from '@/types/survey';
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
import { Plus, UserPlus, Trash2, Edit2, AlertCircle, Users } from 'lucide-react';

interface SectionBRosterProps {
  women: Array<{ woman_line: number; data: Record<string, any> }>;
  declaredCount: number; // A21
  onUpdateWomen: (women: Array<{ woman_line: number; data: Record<string, any> }>) => void;
  language: 'en' | 'ha';
}

export function SectionBRoster({
  women,
  declaredCount,
  onUpdateWomen,
  language
}: SectionBRosterProps) {
  const isHausa = language === 'ha';
  const sectionDef = KASSEP_FORM_DEFINITION.sections.find(s => s.code === 'B')!;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentWoman, setCurrentWoman] = useState<Record<string, any>>({});

  const handleOpenAdd = () => {
    const nextLine = women.length + 1;
    setCurrentWoman({
      woman_line: nextLine,
      residence_status: 1,
      reference_age_eligible: 1,
      available_direct: 1
    });
    setEditingIndex(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    setCurrentWoman({ ...women[index].data, woman_line: women[index].woman_line });
    setEditingIndex(index);
    setModalOpen(true);
  };

  const handleSaveWoman = () => {
    if (!currentWoman.woman_name || !currentWoman.woman_age) {
      alert(isHausa ? 'Da fatan a shigar da sunan mace da shekarunta.' : 'Please enter the woman’s name and age.');
      return;
    }

    const updated = [...women];
    if (editingIndex !== null) {
      updated[editingIndex] = {
        woman_line: updated[editingIndex].woman_line,
        data: currentWoman
      };
    } else {
      updated.push({
        woman_line: updated.length + 1,
        data: currentWoman
      });
    }

    onUpdateWomen(updated);
    setModalOpen(false);
  };

  const handleDeleteWoman = (index: number) => {
    if (confirm(isHausa ? 'Shin kuna da tabbacin cire wannan matar daga jerin?' : 'Are you sure you want to remove this woman?')) {
      const updated = women.filter((_, i) => i !== index).map((w, idx) => ({
        woman_line: idx + 1,
        data: { ...w.data, woman_line: idx + 1 }
      }));
      onUpdateWomen(updated);
    }
  };

  const isCountMismatch = declaredCount > 0 && women.length !== declaredCount;

  return (
    <div className="space-y-4">
      {/* Roster Header & Count Status */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="text-xs text-muted-foreground">
            {isHausa ? 'Jimillar Mata Masu Cancanta a A21:' : 'Declared Eligible Women (A21):'}
            <span className="font-bold text-primary ml-1.5 font-mono">{declaredCount}</span>
          </div>
          <div className="text-xs font-medium text-foreground mt-0.5">
            {isHausa ? 'Adadin Da Aka Rubuta a Roster:' : 'Entered on Roster:'}
            <span className={`font-bold ml-1.5 font-mono ${isCountMismatch ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {women.length} of {declaredCount}
            </span>
          </div>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="text-xs gap-1.5 h-9 font-medium"
        >
          <UserPlus className="size-4" />
          <span>{isHausa ? 'Ƙara Mace Mai Cancanta' : 'Add Eligible Woman'}</span>
        </Button>
      </div>

      {/* Roster Table */}
      {women.length > 0 ? (
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <Table className="min-w-[580px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-mono text-xs">#</TableHead>
                <TableHead className="font-mono text-xs">{isHausa ? 'Suna (PII)' : 'Name (PII)'}</TableHead>
                <TableHead className="font-mono text-xs">{isHausa ? 'Shekaru' : 'Age'}</TableHead>
                <TableHead className="font-mono text-xs">{isHausa ? 'Dangantaka' : 'Relationship'}</TableHead>
                <TableHead className="font-mono text-xs">{isHausa ? 'Matsayi' : 'Status'}</TableHead>
                <TableHead className="font-mono text-xs text-right">{isHausa ? 'Aiki' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {women.map((w, index) => {
                const d = w.data;
                const relationshipLabels: Record<string, string> = {
                  '1': 'Head', '2': 'Wife/Partner', '3': 'Daughter', '4': 'Sister',
                  '5': 'Mother', '6': 'Daughter-in-law', '7': 'Other relative', '8': 'Non-relative'
                };
                const statusLabels: Record<string, string> = {
                  '1': 'Current resident', '2': 'Moved away', '3': 'Deceased'
                };

                return (
                  <TableRow key={index} className="hover:bg-muted/40">
                    <TableCell className="font-mono font-semibold text-primary text-xs">
                      W{w.woman_line}
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-xs">
                      {d.woman_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {d.woman_age} yrs
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {relationshipLabels[String(d.relationship_head)] || '—'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border">
                        {statusLabels[String(d.residence_status)] || 'Resident'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(index)}
                        title="Edit woman record"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDeleteWoman(index)}
                        className="text-destructive hover:text-destructive"
                        title="Delete woman record"
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
        </div>
      ) : (
        <div className="p-8 text-center rounded-xl border border-dashed border-border bg-card text-muted-foreground">
          <Users className="size-8 mx-auto text-muted-foreground/60 mb-2" />
          <p className="text-xs">
            {isHausa ? 'Babu wata mace da aka rubuta tukuna. Danna maɓallin da ke sama don ƙarawa.' : 'No women entered on roster yet. Click "Add Eligible Woman" above to roster household members aged 15–49.'}
          </p>
        </div>
      )}

      {/* Roster Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <header className="border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground">
                {editingIndex !== null ? (isHausa ? 'Gyara Bayanan Mace' : 'Edit Woman Roster Record') : (isHausa ? 'Ƙara Sabuwar Mace Mai Cancanta' : 'Add Eligible Woman to Roster')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Woman Line #W{currentWoman.woman_line || (women.length + 1)}
              </p>
            </header>

            <div className="space-y-3">
              {sectionDef.items.map(item => (
                <QuestionRenderer
                  key={item.variable}
                  item={item}
                  value={currentWoman[item.variable]}
                  onChange={(val) => setCurrentWoman({ ...currentWoman, [item.variable]: val })}
                  language={language}
                />
              ))}
            </div>

            <footer className="pt-3 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                {isHausa ? 'Soke' : 'Cancel'}
              </Button>
              <Button size="sm" onClick={handleSaveWoman}>
                {isHausa ? 'Ajiye Mace' : 'Save Woman to Roster'}
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
