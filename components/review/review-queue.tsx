"use client";

import React, { useState, useEffect } from 'react';
import { ReviewFlag } from '@/types/survey';
import { surveySyncService } from '@/lib/db/sync';
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
  ShieldAlert,
  Search,
  Lock,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewQueueProps {
  currentUserId: string;
  role: 'admin' | 'supervisor' | 'interviewer';
  language: 'en' | 'ha';
}

export function ReviewQueue({
  currentUserId,
  role,
  language
}: ReviewQueueProps) {
  const isHausa = language === 'ha';
  const isAuthorized = role === 'admin' || role === 'supervisor';

  const [flags, setFlags] = useState<ReviewFlag[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedFlag, setSelectedFlag] = useState<ReviewFlag | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isResolving, setIsResolving] = useState(false);

  const loadFlags = async () => {
    const list = await surveySyncService.getReviewFlags();
    setFlags(list);
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleResolve = async () => {
    if (!selectedFlag) return;
    setIsResolving(true);
    await surveySyncService.resolveFlag(
      selectedFlag.id,
      currentUserId,
      resolutionNotes || 'Verified and resolved by field supervisor'
    );
    await loadFlags();
    setIsResolving(false);
    setSelectedFlag(null);
    setResolutionNotes('');
  };

  const filteredFlags = flags.filter(f => {
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    const matchesType = filterType === 'all' || f.type === filterType;
    const matchesSearch =
      f.record_ref.toLowerCase().includes(search.toLowerCase()) ||
      f.assessment_hh_id.toLowerCase().includes(search.toLowerCase()) ||
      f.message.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const getSeverityBadge = (severity: ReviewFlag['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'info':
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="space-y-4 p-3 sm:p-5 md:p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="size-4 text-destructive" />
            {isHausa ? 'Kwamitin Dubawa da Tantancewa' : 'Surveillance Review Queue & Quality Flags'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAuthorized
              ? 'Supervisor & Admin clearance workspace for maternal deaths, stillbirths, and count discrepancies.'
              : 'Interviewer view: showing flags raised on your interviews (Clearance requires supervisor/admin).'}
          </p>
        </div>

        {/* Lock Status */}
        <div className="flex items-center gap-2 text-xs">
          {isAuthorized ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium font-mono text-[11px]">
              ✓ Authorised to Resolve Flags
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border text-muted-foreground text-[11px]">
              <Lock className="size-3" />
              Read-Only for Interviewers
            </span>
          )}
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search HH ID, record ref, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 bg-card border-border text-xs font-mono"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-8 px-2.5 bg-card border border-border rounded-lg text-xs font-mono text-muted-foreground focus:outline-none"
        >
          <option value="pending">Pending Only</option>
          <option value="resolved">Resolved Only</option>
          <option value="all">All Flags</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-8 px-2.5 bg-card border border-border rounded-lg text-xs font-mono text-muted-foreground focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="referral_maternal_death">Maternal Death</option>
          <option value="referral_stillbirth">Stillbirth</option>
          <option value="mismatch">Count Mismatch</option>
          <option value="eligibility_review">Eligibility Review</option>
          <option value="supervisor_followup">Supervisor Follow-up</option>
        </select>
      </div>

      {/* Flags List Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table className="min-w-[680px]">
          <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur">
            <TableRow>
              <TableHead className="font-mono text-xs">Severity</TableHead>
              <TableHead className="font-mono text-xs">Type</TableHead>
              <TableHead className="font-mono text-xs">Record Ref</TableHead>
              <TableHead className="font-mono text-xs">Household ID</TableHead>
              <TableHead className="font-mono text-xs">Message</TableHead>
              <TableHead className="font-mono text-xs">Status</TableHead>
              <TableHead className="font-mono text-xs text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFlags.length > 0 ? (
              filteredFlags.map(flag => (
                <TableRow key={flag.id} className="hover:bg-muted/40">
                  <TableCell className="p-3">
                    <span className={cn('text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md border', getSeverityBadge(flag.severity))}>
                      {flag.severity}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground text-xs font-medium capitalize">
                    {flag.type.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="font-mono text-primary font-semibold text-xs">
                    {flag.record_ref}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {flag.assessment_hh_id}
                  </TableCell>
                  <TableCell className="text-foreground text-xs max-w-xs truncate">
                    {flag.message}
                  </TableCell>
                  <TableCell>
                    <span className={cn('text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border',
                      flag.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                    )}>
                      {flag.status.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {flag.status === 'pending' && isAuthorized ? (
                      <Button
                        size="sm"
                        onClick={() => setSelectedFlag(flag)}
                        className="h-7 text-xs font-medium"
                      >
                        Resolve
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-[11px] font-mono">
                        {flag.status === 'resolved' ? 'Cleared' : 'View Only'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                  No quality or surveillance flags match your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Resolve Modal */}
      {selectedFlag && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <header className="border-b border-border pb-3 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Resolve Surveillance Flag
                </h3>
                <p className="text-xs text-primary font-mono mt-0.5">
                  Record: {selectedFlag.record_ref} ({selectedFlag.assessment_hh_id})
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedFlag(null)}
              >
                <X className="size-4" />
              </Button>
            </header>

            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground">
              <div className="font-semibold text-muted-foreground text-[10px] uppercase mb-1">Trigger Message:</div>
              {selectedFlag.message}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Supervisor Verification Notes & Resolution Action:
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Verified with interviewer; maternal death reported at hospital outside EA bounds. Flag cleared."
                className="w-full p-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <footer className="pt-3 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedFlag(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isResolving}
                onClick={handleResolve}
              >
                {isResolving ? 'Resolving...' : 'Confirm Resolution'}
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
