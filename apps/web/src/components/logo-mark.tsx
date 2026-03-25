import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoMarkProps = {
  compact?: boolean;
  className?: string;
};

export function LogoMark({ compact = false, className }: LogoMarkProps) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-3", className)}>
      <span className="relative grid size-12 place-items-center overflow-hidden rounded-[1.1rem] bg-[linear-gradient(145deg,#1f4632,#10251b)] shadow-[0_20px_50px_-30px_rgba(17,34,23,0.8)]">
        <span className="absolute inset-[1px] rounded-[1rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,180,110,0.45),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
        <span className="relative font-display text-[1.7rem] font-semibold tracking-[0.18em] text-white">
          A
        </span>
        <span className="absolute right-2 top-2 size-2.5 rounded-full bg-accent shadow-[0_0_22px_rgba(212,180,110,0.9)]" />
      </span>

      {!compact ? (
        <span className="flex flex-col">
          <span className="font-display text-[1.95rem] leading-none font-semibold tracking-[0.2em] text-foreground">
            AVIA
          </span>
          <span className="mt-1 text-[0.68rem] uppercase tracking-[0.34em] text-muted-foreground">
            Digital Studio
          </span>
        </span>
      ) : null}
    </Link>
  );
}
