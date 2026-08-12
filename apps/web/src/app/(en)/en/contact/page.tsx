import type { Metadata } from "next";

import { StructuredData } from "@/components/structured-data";
import { ContactView } from "@/components/contact-view";
import { pageMetadata } from "@/lib/seo";

/** Метадані, canonical і hreflang збираються з єдиного джерела — lib/seo. */
export const metadata: Metadata = pageMetadata("en", "contact");

export default function Page() {
  return (
    <>
      <StructuredData page="contact" lang="en" />
      <ContactView />
    </>
  );
}
