"use client";

import React, { useState, useEffect } from 'react';
import {
  HouseholdRecord,
  WomanRecord,
  DeathRecord,
  PregnancyRecord,
  BabyRecord
} from '@/types/survey';
import { surveySyncService } from '@/lib/db/sync';
import { downloadKassepExcel, ExportDataset } from '@/lib/survey/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileSpreadsheet,
  Download,
  Lock,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsesTableViewProps {
  role: 'admin' | 'supervisor' | 'interviewer';
  language: 'en' | 'ha';
}

export function ResponsesTableView({
  role,
  language
}: ResponsesTableViewProps) {
  const isHausa = language === 'ha';
  const isAdmin = role === 'admin';

  const [activeTab, setActiveTab] = useState<'households' | 'women' | 'deaths' | 'pregnancies' | 'babies'>('households');
  const [isIdentified, setIsIdentified] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const [dataset, setDataset] = useState<ExportDataset>({
    households: [],
    women: [],
    deaths: [],
    pregnancies: [],
    babies: []
  });

  const loadData = async () => {
    const [hh, w, det, p, b] = await Promise.all([
      surveySyncService.getHouseholds(),
      surveySyncService.getWomen(),
      surveySyncService.getDeaths(),
      surveySyncService.getPregnancies(),
      surveySyncService.getBabies()
    ]);
    setDataset({
      households: hh,
      women: w,
      deaths: det,
      pregnancies: p,
      babies: b
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = () => {
    downloadKassepExcel(dataset, isIdentified && isAdmin);
  };

  const redactPii = (val: any) => {
    if (!val) return '—';
    if (isIdentified && isAdmin) return String(val);
    return '••••••••';
  };

  return (
    <div className="space-y-4 p-3 sm:p-5 md:p-6">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Database className="size-4 text-primary" />
            {isHausa ? 'Amsoshin Bincike da Fitarwa' : 'Survey Responses & Multi-Level Data Exports'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Level 1 to Level 4 records matching KASSEP official sheet layouts (HH, Women, Deaths, Pregnancy, Baby).
          </p>
        </div>

        {/* Export Controls */}
        <div className="flex items-center gap-3">
          {/* De-identification Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs">
            {isAdmin ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isIdentified}
                  onChange={(e) => setIsIdentified(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className={cn('text-xs font-mono', isIdentified ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-muted-foreground')}>
                  {isIdentified ? 'Identified PII (Admin Mode)' : 'De-Identified Masking'}
                </span>
              </label>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-mono">
                <Lock className="size-3 text-muted-foreground" />
                PII Masked (Admin Only)
              </span>
            )}
          </div>

          <Button
            onClick={handleExport}
            className="text-xs gap-1.5 font-medium"
          >
            <Download className="size-3.5" />
            <span>Export Official XLSX</span>
          </Button>
        </div>
      </header>

      {/* Level Tabs */}
      <nav aria-label="Survey data levels" className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto text-xs">
        {[
          { key: 'households', label: `Level 1: Households (${dataset.households.length})` },
          { key: 'women', label: `Level 2: Women (${dataset.women.length})` },
          { key: 'deaths', label: `Level 2: Deaths (${dataset.deaths.length})` },
          { key: 'pregnancies', label: `Level 3: Pregnancies (${dataset.pregnancies.length})` },
          { key: 'babies', label: `Level 4: Babies (${dataset.babies.length})` }
        ].map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.key as any)}
            className="h-8 text-xs font-mono"
          >
            {tab.label}
          </Button>
        ))}
      </nav>

      {/* Level 1: Households Table */}
      {activeTab === 'households' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur">
              <TableRow>
                <TableHead className="font-mono text-xs">HH ID</TableHead>
                <TableHead className="font-mono text-xs">EA Code</TableHead>
                <TableHead className="font-mono text-xs">Head Name (PII)</TableHead>
                <TableHead className="font-mono text-xs">Respondent (PII)</TableHead>
                <TableHead className="font-mono text-xs">Consent (A14)</TableHead>
                <TableHead className="font-mono text-xs">Eligible Women (A21)</TableHead>
                <TableHead className="font-mono text-xs">Status</TableHead>
                <TableHead className="font-mono text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataset.households.map(hh => (
                <TableRow key={hh.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono font-semibold text-primary text-xs">{hh.assessment_hh_id}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">{hh.ea_code}</TableCell>
                  <TableCell className="text-foreground text-xs">{redactPii(hh.data?.hh_head_name)}</TableCell>
                  <TableCell className="text-foreground text-xs">{redactPii(hh.data?.hh_respondent_name)}</TableCell>
                  <TableCell className="text-xs">{Number(hh.data?.hh_consent) === 1 ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="font-mono font-semibold text-foreground text-xs">{hh.data?.hh_eligible_women ?? 0}</TableCell>
                  <TableCell>
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-mono font-medium">
                      {hh.status.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{hh.interview_date}</TableCell>
                </TableRow>
              ))}
              {dataset.households.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs">
                    No household interviews recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Level 2: Women Table */}
      {activeTab === 'women' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur">
              <TableRow>
                <TableHead className="font-mono text-xs">Woman ID</TableHead>
                <TableHead className="font-mono text-xs">HH ID</TableHead>
                <TableHead className="font-mono text-xs">Name (PII)</TableHead>
                <TableHead className="font-mono text-xs">Age</TableHead>
                <TableHead className="font-mono text-xs">Status</TableHead>
                <TableHead className="font-mono text-xs">Consent (D06)</TableHead>
                <TableHead className="font-mono text-xs">Pregnancies (D10)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataset.women.map(w => (
                <TableRow key={w.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono font-semibold text-primary text-xs">{w.woman_id}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">{w.assessment_hh_id}</TableCell>
                  <TableCell className="text-foreground text-xs">{redactPii(w.data?.woman_name)}</TableCell>
                  <TableCell className="text-foreground text-xs font-mono">{w.data?.woman_age} yrs</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{w.data?.residence_status === 1 ? 'Resident' : 'Non-resident'}</TableCell>
                  <TableCell className="text-xs">{Number(w.data?.individual_consent) === 1 ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="font-mono font-semibold text-foreground text-xs">{w.data?.pregnancy_number ?? 0}</TableCell>
                </TableRow>
              ))}
              {dataset.women.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                    No women rostered yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Level 2: Deaths Table */}
      {activeTab === 'deaths' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur">
              <TableRow>
                <TableHead className="font-mono text-xs">Death #</TableHead>
                <TableHead className="font-mono text-xs">HH ID</TableHead>
                <TableHead className="font-mono text-xs">Deceased (PII)</TableHead>
                <TableHead className="font-mono text-xs">Sex</TableHead>
                <TableHead className="font-mono text-xs">Age at Death</TableHead>
                <TableHead className="font-mono text-xs">Pregnant / Recent Loss</TableHead>
                <TableHead className="font-mono text-xs">Referral Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataset.deaths.map(det => (
                <TableRow key={det.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono font-semibold text-destructive text-xs">D{det.death_line}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">{det.assessment_hh_id}</TableCell>
                  <TableCell className="text-foreground text-xs">{redactPii(det.data?.deceased_name)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{Number(det.data?.deceased_sex) === 1 ? 'Female' : 'Male'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{det.data?.age_at_death?.value} {det.data?.age_at_death?.unit}</TableCell>
                  <TableCell className="text-xs">
                    {Number(det.data?.deceased_sex) === 1
                      ? `Preg: ${det.data?.pregnant_at_death === 1 ? 'Yes' : 'No'} | Loss: ${det.data?.recent_pregnancy_end === 1 ? 'Yes' : 'No'}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {Number(det.data?.death_followup) === 1 ? (
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-[10px] font-mono font-medium">
                        FLAGGED
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs font-mono">Standard</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {dataset.deaths.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                    No household deaths reported.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Level 3: Pregnancies Table */}
      {activeTab === 'pregnancies' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur">
              <TableRow>
                <TableHead className="font-mono text-xs">Pregnancy ID</TableHead>
                <TableHead className="font-mono text-xs">Woman Line</TableHead>
                <TableHead className="font-mono text-xs">Outcome Type</TableHead>
                <TableHead className="font-mono text-xs">Babies Born (E11)</TableHead>
                <TableHead className="font-mono text-xs">Delivery Place</TableHead>
                <TableHead className="font-mono text-xs">Maternal Status</TableHead>
                <TableHead className="font-mono text-xs">Surveillance Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataset.pregnancies.map(p => (
                <TableRow key={p.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono font-semibold text-primary text-xs">{p.pregnancy_id}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">W{p.woman_line}</TableCell>
                  <TableCell className="text-foreground text-xs">
                    {Number(p.data?.outcome_type) === 1 ? 'Birth' : Number(p.data?.outcome_type) === 2 ? 'Miscarriage' : 'Other loss'}
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-foreground text-xs">{p.data?.babies_number ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{p.data?.delivery_place === 1 ? 'Home' : 'Facility'}</TableCell>
                  <TableCell className="text-xs">{Number(p.data?.maternal_status) === 1 ? 'Alive' : 'Deceased'}</TableCell>
                  <TableCell className="text-xs">{Number(p.data?.pregnancy_contact) === 1 ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
              {dataset.pregnancies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                    No pregnancy episodes entered.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Level 4: Babies Table */}
      {activeTab === 'babies' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur">
              <TableRow>
                <TableHead className="font-mono text-xs">Baby #</TableHead>
                <TableHead className="font-mono text-xs">Pregnancy ID</TableHead>
                <TableHead className="font-mono text-xs">Sex</TableHead>
                <TableHead className="font-mono text-xs">Signs of Life (E13c)</TableHead>
                <TableHead className="font-mono text-xs">Heartbeat (E13d)</TableHead>
                <TableHead className="font-mono text-xs">Alive Now (E13e)</TableHead>
                <TableHead className="font-mono text-xs">Survival Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataset.babies.map(b => (
                <TableRow key={b.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono font-semibold text-primary text-xs">Baby #{b.baby_id}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">{b.pregnancy_id}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{Number(b.data?.baby_sex) === 1 ? 'Female' : 'Male'}</TableCell>
                  <TableCell className="text-xs">{Number(b.data?.signs_life) === 1 ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-xs">{Number(b.data?.heartbeat_sign) === 1 ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="font-semibold text-xs">{Number(b.data?.baby_alive) === 1 ? 'Alive' : 'Deceased'}</TableCell>
                  <TableCell>
                    {Number(b.data?.signs_life) !== 1 ? (
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-[10px] font-mono font-medium">
                        STILLBIRTH REVIEW
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-mono">Live birth</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {dataset.babies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                    No baby records entered.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
