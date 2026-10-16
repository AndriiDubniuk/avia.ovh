import type { Metadata } from "next";

import { ServicesHubView } from "@/components/service-view";
import { StructuredData } from "@/components/structured-data";
import { servicesHubMetadata } from "@/lib/seo";

export const metadata: Metadata = servicesHubMetadata("ua");

export default function Page() {
  return (
    <>
      <StructuredData page="services" lang="ua" />
      <ServicesHubView />
    </>
  );
}
