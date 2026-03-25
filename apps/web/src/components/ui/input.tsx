import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full rounded-2xl border border-border bg-input px-4 text-base text-foreground outline-none placeholder:text-muted-foreground/85 focus:border-primary/25 focus:ring-4 focus:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
