"use client";

import React, { useState, useEffect } from 'react';
import { surveySyncService } from '@/lib/db/sync';
import {
  MapPin,
  Home,
  Users,
  Baby,
  HeartPulse,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export function StatsOverview() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const [stats, setStats] = useState({
    easTotal: 0,
    easCompleted: 0,
    householdsInterviewed: 0,
    womenInterviewed: 0,
    pregnanciesRecorded: 0,
    birthsRecorded: 0,
    deathsFlagged: 0,
    referralsOpen: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [eas, hh, w, det, p, b, flags] = await Promise.all([
          surveySyncService.getEnumerationAreas(),
          surveySyncService.getHouseholds(),
          surveySyncService.getWomen(),
          surveySyncService.getDeaths(),
          surveySyncService.getPregnancies(),
          surveySyncService.getBabies(),
          surveySyncService.getReviewFlags()
        ]);

        const doneEas = eas.filter(e => e.status === 'completed').length;
        const openRef = flags.filter(f => f.status === 'pending' && f.type.startsWith('referral')).length;
        const deathFlags = det.length + flags.filter(f => f.type === 'referral_maternal_death').length;

        setStats({
          easTotal: eas.length,
          easCompleted: doneEas,
          householdsInterviewed: hh.length,
          womenInterviewed: w.length,
          pregnanciesRecorded: p.length,
          birthsRecorded: b.length,
          deathsFlagged: deathFlags,
          referralsOpen: openRef
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const coveragePct = stats.easTotal > 0
    ? Math.round((stats.easCompleted / stats.easTotal) * 100)
    : 0;

  const cards = [
    {
      title: 'Enumeration Areas',
      value: `${stats.easCompleted} / ${stats.easTotal}`,
      sub: `${coveragePct}% coverage`,
      icon: MapPin,
      iconClass: 'text-primary'
    },
    {
      title: 'Households Assessed',
      value: stats.householdsInterviewed,
      sub: stats.householdsInterviewed === 0 ? 'No households yet' : 'Selected sample',
      icon: Home,
      iconClass: 'text-primary'
    },
    {
      title: 'Eligible Women (15–49)',
      value: stats.womenInterviewed,
      sub: stats.womenInterviewed === 0 ? 'No women rostered' : 'Rostered & screened',
      icon: Users,
      iconClass: 'text-primary'
    },
    {
      title: 'Pregnancies Recorded',
      value: stats.pregnanciesRecorded,
      sub: stats.pregnanciesRecorded === 0 ? 'No episodes yet' : 'Phase 1 & 2 overlap',
      icon: HeartPulse,
      iconClass: 'text-primary'
    },
    {
      title: 'Babies Documented',
      value: stats.birthsRecorded,
      sub: stats.birthsRecorded === 0 ? 'No births yet' : 'Vital signs verified',
      icon: Baby,
      iconClass: 'text-primary'
    },
    {
      title: 'Active Referrals',
      value: stats.referralsOpen,
      sub: stats.referralsOpen === 0 ? 'All clear' : 'Stillbirths & maternal deaths',
      icon: AlertTriangle,
      iconClass: stats.referralsOpen > 0 ? 'text-destructive' : 'text-muted-foreground'
    }
  ];

  return (
    <div className="space-y-2">
      {isDemo && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 w-fit rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono">
          <Sparkles className="size-3" />
          <span>Demo data</span>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between transition-colors"
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium truncate">{c.title}</span>
                <Icon className={`size-4 ${c.iconClass} shrink-0`} />
              </div>
              <div className="mt-2">
                <div className="text-xl font-bold text-foreground font-mono tracking-tight">
                  {loading ? '—' : c.value}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
