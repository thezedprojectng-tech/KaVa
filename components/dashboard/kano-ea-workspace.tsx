"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { EnumerationArea } from '@/types/auth';
import { HouseholdRecord } from '@/types/survey';
import { surveySyncService } from '@/lib/db/sync';
import { SEED_KANO_EAS } from '@/lib/db/seed-eas';
import { useAuth } from '@/lib/auth/auth-context';
import { userHasEaAccess } from '@/lib/auth/ea-access';
import { KanoMap } from './kano-map';
import { StatsOverview } from './stats-overview';
import { EaImportDialog } from './ea-import-dialog';
import { HouseholdListView } from './household-list-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Map as MapIcon,
  Home,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  ChevronRight,
  Building2,
  Users,
  Compass,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanoEaWorkspaceProps {
  language: 'en' | 'ha';
  onStartInterviewWithEa: (eaCode: string, hhId?: string) => void;
}

export function KanoEaWorkspace({
  language,
  onStartInterviewWithEa
}: KanoEaWorkspaceProps) {
  const isHausa = language === 'ha';
  const { user, role } = useAuth();

  const [eas, setEas] = useState<EnumerationArea[]>(SEED_KANO_EAS);
  const [households, setHouseholds] = useState<HouseholdRecord[]>([]);
  const [selectedEa, setSelectedEa] = useState<EnumerationArea | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'households'>(() => {
    if (typeof window === 'undefined') return 'map';
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    return tabParam === 'households' ? 'households' : 'map';
  });
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLga, setSelectedLga] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const [isDark, setIsDark] = useState(() =>
    typeof document === 'undefined'
      ? false
      : document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains('dark'));
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Filter EAs by user authorization:
  // - Admin: all EAs
  // - Supervisor: assigned LGAs or assigned EAs
  // - Interviewer: strictly assigned EA codes only
  const accessibleEas = useMemo(() => {
    return eas.filter((ea) => userHasEaAccess(user, ea));
  }, [eas, user]);

  const loadData = async () => {
    try {
      const [loadedEas, loadedHh] = await Promise.all([
        surveySyncService.getEnumerationAreas(),
        surveySyncService.getHouseholds()
      ]);
      const resolvedEas = loadedEas.length > 0 ? loadedEas : SEED_KANO_EAS;
      setEas(resolvedEas);
      setHouseholds(loadedHh);
    } catch (err) {
      console.warn('Failed to load DB EAs, fallback to seed:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keep selectedEa synchronized with accessible EAs
  useEffect(() => {
    if (accessibleEas.length > 0) {
      if (!selectedEa || !accessibleEas.some((e) => e.code === selectedEa.code)) {
        setSelectedEa(accessibleEas[0]);
      }
    } else {
      setSelectedEa(null);
    }
  }, [accessibleEas, selectedEa]);

  const handleImportSuccess = async (newEas: EnumerationArea[]) => {
    await surveySyncService.upsertEnumerationAreas(newEas);
    await loadData();
  };

  const lgas = useMemo(() => {
    const set = new Set(accessibleEas.map((e) => e.lga));
    return Array.from(set).sort();
  }, [accessibleEas]);

  const filteredEas = useMemo(() => {
    return accessibleEas.filter((e) => {
      const matchesSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.code.toLowerCase().includes(search.toLowerCase()) ||
        e.ward.toLowerCase().includes(search.toLowerCase());
      const matchesLga = selectedLga === 'all' || e.lga === selectedLga;
      const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;
      return matchesSearch && matchesLga && matchesStatus;
    });
  }, [accessibleEas, search, selectedLga, selectedStatus]);

  const handleSelectEa = (ea: EnumerationArea) => {
    setSelectedEa(ea);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileView('map');
      setMobileDrawerOpen(true);
    }
  };

  return (
    <div className="space-y-4 p-3 sm:p-5 md:p-6">
      {/* 1. Monitoring Stats Cards */}
      <StatsOverview />

      {/* 2. Main Workspace Layout */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
        {/* Workspace Sub-Toolbar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3 bg-muted/30">
          {/* Sub-tabs: Browse & Map / Household List */}
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant={activeTab === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('map')}
              className="gap-1.5 text-xs font-medium"
            >
              <MapIcon className="size-3.5" />
              <span>{isHausa ? 'Taswira & Rukunin EAs' : 'Browse & Map'}</span>
            </Button>

            <Button
              type="button"
              variant={activeTab === 'households' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('households')}
              className="gap-1.5 text-xs font-medium"
            >
              <Home className="size-3.5" />
              <span>{isHausa ? 'Jerin Gidaje (HH)' : 'Household List'}</span>
              {selectedEa && (
                <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-primary/10 text-primary">
                  {selectedEa.code}
                </span>
              )}
            </Button>
          </div>

          {/* Right Toolbar Controls: Mobile List/Map toggle + Import Button */}
          <div className="flex items-center gap-2">
            {activeTab === 'map' && (
              <div className="flex md:hidden items-center p-0.5 rounded-lg bg-muted border border-border">
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className={cn(
                    'px-2 py-1 rounded-md text-xs font-medium transition-colors',
                    mobileView === 'list'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  List ({filteredEas.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMobileView('map')}
                  className={cn(
                    'px-2 py-1 rounded-md text-xs font-medium transition-colors',
                    mobileView === 'map'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Map
                </button>
              </div>
            )}

            {/* Import EA Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImportOpen(true)}
              className="text-xs gap-1.5"
            >
              <Upload className="size-3.5" />
              <span className="hidden sm:inline">Import EAs</span>
            </Button>
          </div>
        </header>

        {/* Tab 1: Browse & Map Layout */}
        {activeTab === 'map' && (
          <div className="relative flex h-[580px] sm:h-[620px] lg:h-[660px] w-full min-h-0 overflow-hidden">
            {/* Left: Searchable EA List */}
            <aside
              className={cn(
                'w-full md:w-72 xl:w-80 shrink-0 border-r border-border flex-col bg-background min-h-0',
                mobileView === 'list' ? 'flex' : 'hidden md:flex'
              )}
            >
              {/* Search & Filters */}
              <div className="p-3 border-b border-border space-y-2.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search EA, ward, code..."
                    className="h-8 pl-8 text-xs font-mono bg-muted/50 border-border shadow-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={selectedLga}
                    onChange={(e) => setSelectedLga(e.target.value)}
                    className="h-7 px-2 rounded-md bg-muted/50 border border-border text-[11px] font-mono text-muted-foreground focus:outline-none"
                  >
                    <option value="all">All LGAs ({lgas.length})</option>
                    {lgas.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-7 px-2 rounded-md bg-muted/50 border border-border text-[11px] font-mono text-muted-foreground focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="not_started">Not Started</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Showing {filteredEas.length} of {accessibleEas.length} accessible EAs</span>
                </div>
              </div>

              {/* EA Items List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {filteredEas.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground font-mono space-y-2">
                    <Building2 className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="font-semibold text-foreground">
                      {accessibleEas.length === 0
                        ? (isHausa ? 'Babu Rukunin EAs da aka baka' : 'No Enumeration Areas Assigned')
                        : (isHausa ? 'Babu sakamako' : 'No matching EAs found')}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {accessibleEas.length === 0
                        ? (isHausa
                            ? 'Ba a sanya muku ko wanne EA ba tukuna. Tuntuɓi mai kula da ku (Supervisor).'
                            : 'You have not been assigned any EAs yet. Please contact your field supervisor.')
                        : (isHausa ? 'Gwada canza rubutun bincike ko tace LGA.' : 'Try adjusting your search or filters.')}
                    </p>
                  </div>
                ) : (
                  filteredEas.map((ea) => {
                  const isSelected = selectedEa?.id === ea.id;
                  const pct = Math.round((ea.completedHouseholds / ea.targetHouseholds) * 100);

                  return (
                    <button
                      key={ea.id}
                      type="button"
                      onClick={() => handleSelectEa(ea)}
                      className={cn(
                        'w-full text-left p-3 transition-colors outline-none flex flex-col gap-1.5 hover:bg-muted/50',
                        isSelected && 'bg-primary/10 border-l-2 border-primary'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {ea.code}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border',
                            ea.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                              : ea.status === 'in_progress'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                          )}
                        >
                          {ea.status === 'completed'
                            ? 'Complete'
                            : ea.status === 'in_progress'
                            ? 'In Progress'
                            : 'Not Started'}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-foreground truncate">
                        {ea.name}
                      </div>

                      <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>{ea.ward} Ward, {ea.lga}</span>
                        <span className="font-mono text-[10px]">{ea.completedHouseholds}/{ea.targetHouseholds} HHs</span>
                      </div>

                      {/* Mini progress track */}
                      <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            ea.status === 'completed' ? 'bg-emerald-500' : 'bg-primary'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                }))}
              </div>
            </aside>

            {/* Center: MapLibre Basemap */}
            <main
              className={cn(
                'flex-1 min-w-0 relative h-full',
                mobileView === 'map' ? 'flex flex-col' : 'hidden md:flex flex-col'
              )}
            >
              <KanoMap
                eas={filteredEas}
                selectedEa={selectedEa}
                onSelectEa={handleSelectEa}
                isDark={isDark}
              />

              {/* Floating Return to List button for mobile */}
              <div className="absolute top-3 right-3 z-10 md:hidden pointer-events-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setMobileView('list')}
                  className="h-8 gap-1.5 text-xs font-mono shadow-md backdrop-blur bg-background/90 hover:bg-background border border-border"
                >
                  <Search className="size-3.5 text-primary" />
                  <span>List ({filteredEas.length})</span>
                </Button>
              </div>
            </main>

            {/* Right: Desktop EA Details Panel (Side-by-side, does NOT cover pins) */}
            {selectedEa && (
              <aside className="hidden lg:flex w-80 xl:w-92 shrink-0 border-l border-border bg-background flex-col justify-between min-h-0 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {/* Panel Header */}
                  <div className="flex items-start justify-between border-b border-border pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20">
                          {selectedEa.code}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border',
                            selectedEa.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                              : selectedEa.status === 'in_progress'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                          )}
                        >
                          {selectedEa.status === 'completed'
                            ? 'Complete'
                            : selectedEa.status === 'in_progress'
                            ? 'In Progress'
                            : 'Not Started'}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mt-1.5">
                        {selectedEa.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{selectedEa.ward} Ward, {selectedEa.lga} LGA</p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setSelectedEa(null)}
                      aria-label="Close details"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>

                  {/* Progress & Stats Card */}
                  <div className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Household Progress</span>
                      <span className="font-semibold text-foreground">
                        {selectedEa.completedHouseholds} / {selectedEa.targetHouseholds} done
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(selectedEa.completedHouseholds / selectedEa.targetHouseholds) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Field Team Details */}
                  <dl className="space-y-3 font-mono text-xs">
                    <div className="flex items-start justify-between gap-2 border-b border-border pb-2">
                      <dt className="text-muted-foreground">Supervisor</dt>
                      <dd className="text-foreground font-medium text-right">
                        {selectedEa.supervisorName || 'Dr. Fatima Umar'}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-2 border-b border-border pb-2">
                      <dt className="text-muted-foreground">Interviewer</dt>
                      <dd className="text-foreground font-medium text-right">
                        {selectedEa.interviewerName || 'Ibrahim Bello'}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-2 border-b border-border pb-2">
                      <dt className="text-muted-foreground">Segment</dt>
                      <dd className="text-foreground font-medium text-right">
                        Segment {selectedEa.segment}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-2 border-b border-border pb-2">
                      <dt className="text-muted-foreground">GPS Coordinates</dt>
                      <dd className="text-foreground font-medium text-right">
                        {selectedEa.latitude.toFixed(4)}, {selectedEa.longitude.toFixed(4)}
                      </dd>
                    </div>
                  </dl>

                  {/* Field Notes */}
                  {selectedEa.notes && (
                    <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
                      <span className="font-medium text-foreground block mb-0.5">Field Notes:</span>
                      {selectedEa.notes}
                    </div>
                  )}
                </div>

                {/* Primary Action Footer */}
                <div className="p-4 border-t border-border bg-muted/30 space-y-2">
                  <Button
                    type="button"
                    onClick={() => onStartInterviewWithEa(selectedEa.code)}
                    className="w-full gap-2 font-medium"
                  >
                    <span>{isHausa ? 'Fara Tattaunawa a Wannan EA' : 'Start Household Interview'}</span>
                    <ArrowRight className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('households')}
                    className="w-full text-xs"
                  >
                    <span>{isHausa ? 'Duba Jerin Gidaje' : 'View Sampled Households (10)'}</span>
                  </Button>
                </div>
              </aside>
            )}
          </div>
        )}

        {/* Tab 2: Household List Layout */}
        {activeTab === 'households' && selectedEa && (
          <div className="p-4">
            <HouseholdListView
              ea={selectedEa}
              households={households.filter((h) => h.ea_code === selectedEa.code)}
              onStartInterview={(hhId) => onStartInterviewWithEa(selectedEa.code, hhId)}
              language={language}
            />
          </div>
        )}
      </div>

      {/* Mobile Details Drawer */}
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerContent className="p-4 space-y-4">
          {selectedEa && (
            <>
              <DrawerHeader className="p-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                    {selectedEa.code}
                  </span>
                  <span className="text-xs text-muted-foreground">{selectedEa.ward} Ward</span>
                </div>
                <DrawerTitle className="text-base font-semibold mt-1">
                  {selectedEa.name}
                </DrawerTitle>
                <DrawerDescription className="text-xs">
                  {selectedEa.lga} LGA • Interviewer: {selectedEa.interviewerName || 'Ibrahim Bello'}
                </DrawerDescription>
              </DrawerHeader>

              <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Households:</span>
                  <span className="font-mono font-medium">{selectedEa.completedHouseholds}/{selectedEa.targetHouseholds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GPS Location:</span>
                  <span className="font-mono">{selectedEa.latitude.toFixed(4)}, {selectedEa.longitude.toFixed(4)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onStartInterviewWithEa(selectedEa.code);
                  }}
                  className="w-full gap-2"
                >
                  <span>Start Household Interview</span>
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Bulk EA Import Dialog */}
      <EaImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
