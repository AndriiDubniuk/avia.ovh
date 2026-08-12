import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <Link
      href="/"
      aria-label="AVIA Digital — на головну"
      className={cn(
        "font-mono text-[14px] font-bold tracking-[0.44em] text-[var(--runway)] transition-opacity hover:opacity-80",
        className,
      )}
    >
      AVI<b className="text-[var(--signal)]">A</b>
    </Link>
  );
}
