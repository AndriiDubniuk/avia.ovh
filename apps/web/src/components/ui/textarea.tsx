import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-32 w-full rounded-[1.5rem] border border-border bg-input px-4 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground/85 focus:border-primary/25 focus:ring-4 focus:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
