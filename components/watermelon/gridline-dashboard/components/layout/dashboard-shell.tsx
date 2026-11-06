"use client";
import { useEffect, useState, type ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";
import { AppSidebar } from "./app-sidebar";
import { TopNavbar } from "./top-navbar";

export function DashboardShell({ children }: { children: ReactNode }) {
  // Always start false on SSR to avoid hydration mismatch.
  // The useEffect below corrects it immediately on the client after mount.
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const urlTheme = new URLSearchParams(window.location.search).get("theme");
    if (urlTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (urlTheme === "light") {
      document.documentElement.classList.remove("dark");
    }

    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains("dark"));
    const observer = new MutationObserver(syncTheme);

    syncTheme();
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  function handleThemeChange(dark: boolean) {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
    setIsDark(dark);
  }

  return (
    <TooltipProvider>
      <div className={cn("gridline-dashboard relative h-svh min-h-0 overflow-hidden transition-colors", isDark && "dark")}>
        <AppSidebar />
        <TopNavbar isDark={isDark} onThemeChange={handleThemeChange} />

        <main
          aria-label="Page content"
          className="h-full overflow-y-auto pt-14 md:pl-17"
        >
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
