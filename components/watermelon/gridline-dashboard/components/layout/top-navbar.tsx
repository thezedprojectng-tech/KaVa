"use client";

import { MoonStar, SunDim, Search, Globe, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useDashboardNavigation } from "../navigation";
import { ProfileMenu } from "../shared/profile-menu";
import { MobileNavigation, primaryNavigation } from "./app-sidebar";
import { useAuth } from "@/lib/auth/auth-context";

type TopbarProps = {
  isDark: boolean;
  onThemeChange: (isDark: boolean) => void;
};

export function TopNavbar({ isDark, onThemeChange }: TopbarProps) {
  const { pathname } = useDashboardNavigation();
  const { language, setLanguage } = useAuth();

  const currentNav = primaryNavigation.find((item) =>
    item.href === "/"
      ? pathname === item.href
      : pathname.startsWith(item.href),
  );
  const activeLabel = currentNav?.label ?? "Dashboard";

  return (
    <header className="absolute left-0 right-0 top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 backdrop-blur px-3 sm:px-5 md:left-17 md:px-6 text-foreground transition-colors">
      {/* Left: Mobile Nav + Breadcrumb Page Title */}
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <MobileNavigation isDark={isDark} onThemeChange={onThemeChange} />
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-foreground tracking-tight hidden sm:inline">KaVa</span>
          <ChevronRight className="size-3.5 text-muted-foreground hidden sm:inline" />
          <span className="font-medium text-foreground truncate">{activeLabel}</span>
        </nav>
      </div>

      {/* Right: Search, Language, Theme, Status dot, Profile Menu */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3 text-xs">
        {/* Quick Search */}
        <div className="relative hidden md:block w-48 lg:w-60">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search EAs, wards..."
            className="h-8 pl-8 text-xs font-mono bg-muted/50 border-border focus-visible:ring-1"
          />
        </div>

        {/* Language Switch */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ha' : 'en')}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2 text-xs font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Toggle English / Hausa"
          aria-label="Toggle language"
        >
          <Globe className="size-3 text-primary" />
          <span className="font-semibold">{language.toUpperCase()}</span>
        </button>

        {/* Theme Toggle */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 h-8">
          {isDark ? (
            <MoonStar className="size-3.5 text-primary" strokeWidth={1.75} />
          ) : (
            <SunDim className="size-3.5 text-amber-500" strokeWidth={1.75} />
          )}
          <Switch
            checked={isDark}
            onCheckedChange={onThemeChange}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            className="scale-75 origin-center"
          />
        </div>

        {/* Sync Status Dot */}
        <div
          className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground px-1"
          title="Local IndexedDB sync active"
        >
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden xl:inline">Sync Ready</span>
        </div>

        {/* Profile Menu */}
        <ProfileMenu placement="topbar" />
      </div>
    </header>
  );
}
