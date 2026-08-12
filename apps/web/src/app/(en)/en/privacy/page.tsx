import type { Metadata } from "next";

import { StructuredData } from "@/components/structured-data";
import { PrivacyView } from "@/components/legal-shell";
import { pageMetadata } from "@/lib/seo";

/** Метадані, canonical і hreflang збираються з єдиного джерела — lib/seo. */
export const metadata: Metadata = pageMetadata("en", "privacy");

export default function Page() {
  return (
    <>
      <StructuredData page="privacy" lang="en" />
      <PrivacyView />
    </>
  );
}
