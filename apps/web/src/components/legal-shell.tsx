import Link from "next/link";

import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LegalSection = {
  title: string;
  content: readonly string[];
};

type LegalShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: readonly LegalSection[];
};

export function LegalShell({
  eyebrow,
  title,
  description,
  sections,
}: LegalShellProps) {
  return (
    <div className="shell grain flex-1">
      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <LogoMark />
          <Button asChild variant="outline" className="w-full rounded-full sm:w-auto">
            <Link href="/">На головну</Link>
          </Button>
        </div>

        <div className="mt-12">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="section-title mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {description}
          </p>
        </div>

        <div className="mt-10 grid gap-5">
          {sections.map((section) => (
            <Card key={section.title} className="border-white/60 bg-white/78">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-base leading-8 text-muted-foreground">
                {section.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
