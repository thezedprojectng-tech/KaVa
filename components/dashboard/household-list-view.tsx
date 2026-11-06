"use client";

import React, { useState } from 'react';
import { EnumerationArea } from '@/types/auth';
import { HouseholdRecord } from '@/types/survey';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Home,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface HouseholdListViewProps {
  ea: EnumerationArea;
  households: HouseholdRecord[];
  onStartInterview: (hhId?: string) => void;
  language: 'en' | 'ha';
}

export function HouseholdListView({
  ea,
  households,
  onStartInterview,
  language
}: HouseholdListViewProps) {
  const isHausa = language === 'ha';

  // Generate 10 standard sampled households if none yet
  const sampledList = households.length > 0 ? households : Array.from({ length: 10 }).map((_, i) => {
    const hhNum = String(i + 1).padStart(3, '0');
    return {
      id: `sample-${ea.code}-${hhNum}`,
      assessment_hh_id: `${ea.code}-HH-${hhNum}`,
      ea_id: ea.id,
      ea_code: ea.code,
      lga_code: ea.lga,
      ward_code: ea.ward,
      community: ea.name,
      segment_id: ea.segment,
      interviewer_id: ea.interviewerName || 'Unassigned',
      interview_date: '—',
      visit_number: 1,
      visit_result: 1,
      status: (i < ea.completedHouseholds ? 'submitted' : i < ea.completedHouseholds + ea.inProgressHouseholds ? 'draft' : 'draft') as any,
      data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  return (
    <div className="space-y-4">
      {/* EA Context Card */}
      <header className="p-4 rounded-xl bg-card border border-border flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20">
              {ea.code}
            </span>
            <span className="text-xs text-muted-foreground">{ea.ward} Ward, {ea.lga} LGA</span>
          </div>
          <h2 className="text-base font-semibold text-foreground mt-1">{ea.name}</h2>
          <p className="text-xs text-muted-foreground">
            Assigned Interviewer: <span className="text-foreground font-medium">{ea.interviewerName || 'Ibrahim Bello'}</span>
          </p>
        </div>

        {/* Warning Banner: Sampling Integrity */}
        <aside aria-label="Sampling protocol rules" className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-md text-xs text-amber-700 dark:text-amber-300 leading-tight">
          <div className="font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-300 mb-1">
            <AlertTriangle className="size-3.5" />
            STRICT SAMPLING FRAME RULE
          </div>
          Ten households means ten selected households from the sampling list — not ten households with pregnancies. Record non-response without informal substitution.
        </aside>
      </header>

      {/* Household Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table className="min-w-[640px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs">Sample Line</TableHead>
              <TableHead className="font-mono text-xs">Assessment HH ID</TableHead>
              <TableHead className="font-mono text-xs">Head of Household (PII)</TableHead>
              <TableHead className="font-mono text-xs">Visit Attempts</TableHead>
              <TableHead className="font-mono text-xs">Visit Result</TableHead>
              <TableHead className="font-mono text-xs">Interview Status</TableHead>
              <TableHead className="font-mono text-xs text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampledList.map((hh, idx) => {
              const isDone = hh.status === 'submitted' || idx < ea.completedHouseholds;
              const isInProgress = !isDone && idx < ea.completedHouseholds + ea.inProgressHouseholds;

              return (
                <TableRow key={hh.id || idx} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    #{String(idx + 1).padStart(2, '0')}
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-primary text-xs">
                    {hh.assessment_hh_id}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {isDone ? '•••••••• (Masked)' : 'Sampled Household'}
                  </TableCell>
                  <TableCell className="text-foreground text-xs">
                    Attempt {hh.visit_number || 1}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {hh.visit_result === 1 ? 'Located & Available' : `Result code: ${hh.visit_result}`}
                  </TableCell>
                  <TableCell>
                    {isDone ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-mono font-medium">
                        COMPLETED
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono font-medium">
                        IN PROGRESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border text-[10px] font-mono">
                        NOT STARTED
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => onStartInterview(hh.assessment_hh_id)}
                      variant={isDone ? "outline" : "default"}
                      className="h-7 text-xs font-medium"
                    >
                      <span>{isDone ? 'View / Edit' : 'Start Interview'}</span>
                      <ArrowRight className="size-3 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
