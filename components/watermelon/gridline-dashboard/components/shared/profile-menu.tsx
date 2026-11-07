"use client";

import { UserRound, Shield, Check, Globe, Wifi, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { supabase } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ProfileMenu({
  placement,
  className,
}: {
  placement: "sidebar" | "topbar";
  className?: string;
}) {
  const { user, role, setRole, language, setLanguage, signOut } = useAuth();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const handleSignOut = async () => {
    await signOut();
    // Clear any locally-persisted theme preference and reload
    window.location.href = '/';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open profile menu"
        title="Profile & Settings"
        className={cn(
          buttonVariants({
            variant: placement === "topbar" ? "outline" : "ghost",
            size: "icon-sm",
          }),
          "rounded-lg",
          placement === "sidebar" && "text-muted-foreground",
          className,
        )}
      >
        <UserRound aria-hidden="true" className="size-4 text-primary" strokeWidth={1.8} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={placement === "sidebar" ? "right" : "bottom"}
        align="end"
        sideOffset={8}
        className="w-68 bg-popover border-border text-popover-foreground shadow-md"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-semibold text-xs text-muted-foreground">
            Current Operator
          </DropdownMenuLabel>
          <div className="px-2 py-1.5">
            <div className="text-xs font-semibold text-foreground">{user.fullName}</div>
            <div className="text-[11px] text-muted-foreground font-mono">{user.email}</div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                <Shield className="size-2.5" />
                {role}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Phase 1 & 2
              </span>
            </div>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 font-mono text-[11px] text-muted-foreground flex items-center gap-2">
          <Wifi className="size-3 text-emerald-500" />
          <span>Local IndexedDB Ready (Kano)</span>
        </div>

        {/* Role switcher - only displayed if DEMO mode is enabled */}
        {isDemo && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-semibold text-[11px] text-muted-foreground">
                Switch Role (Demo Simulation)
              </DropdownMenuLabel>
              {(['admin', 'supervisor', 'interviewer'] as const).map((r) => (
                <DropdownMenuItem
                  key={r}
                  onClick={() => setRole(r)}
                  className="flex items-center justify-between text-xs capitalize cursor-pointer hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="size-3.5 text-primary" />
                    <span>{r}</span>
                  </div>
                  {role === r && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-semibold text-[11px] text-muted-foreground">
            Language / Harshe
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setLanguage('en')}
            className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted"
          >
            <span>English</span>
            {language === 'en' && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLanguage('ha')}
            className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted"
          >
            <span>Hausa (KASSEP)</span>
            {language === 'ha' && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-destructive cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
