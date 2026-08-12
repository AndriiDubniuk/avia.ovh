import type { Metadata } from "next";

import { StructuredData } from "@/components/structured-data";
import { OfferView } from "@/components/legal-shell";
import { pageMetadata } from "@/lib/seo";

/** Метадані, canonical і hreflang збираються з єдиного джерела — lib/seo. */
export const metadata: Metadata = pageMetadata("ua", "offer");

export default function Page() {
  return (
    <>
      <StructuredData page="offer" lang="ua" />
      <OfferView />
    </>
  );
}
