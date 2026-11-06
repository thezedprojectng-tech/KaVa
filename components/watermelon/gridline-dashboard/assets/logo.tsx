"use client";
import { cn } from "@/lib/utils";

export function Logo({
  showName = true,
  compact = false,
}: {
  showName?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs",
          compact ? "size-8 text-xs" : "size-9 text-sm",
        )}
      >
        <span className="tracking-tighter font-mono font-bold">KV</span>
      </div>
      {showName && (
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5 leading-none">
            KaVa
            <span className="text-[10px] font-normal px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              KASSEP
            </span>
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 leading-none truncate">
            DMAF Kano State
          </span>
        </div>
      )}
    </div>
  );
}
