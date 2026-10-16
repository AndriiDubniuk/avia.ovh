import type { Metadata } from "next";

import { LocalView } from "@/components/city-view";
import { StructuredData } from "@/components/structured-data";
import { localMetadata } from "@/lib/seo";

export const metadata: Metadata = localMetadata("ua");

export default function Page() {
  return (
    <>
      <StructuredData page="local" lang="ua" />
      <LocalView />
    </>
  );
}
