import type { Metadata } from "next";

import { StructuredData } from "@/components/structured-data";
import { HomeView } from "@/components/home-view";
import { pageMetadata } from "@/lib/seo";

/** Метадані, canonical і hreflang збираються з єдиного джерела — lib/seo. */
export const metadata: Metadata = pageMetadata("en", "home");

export default function Page() {
  return (
    <>
      <StructuredData page="home" lang="en" />
      <HomeView />
    </>
  );
}
