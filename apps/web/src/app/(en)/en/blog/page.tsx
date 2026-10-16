import type { Metadata } from "next";

import { BlogHubView } from "@/components/article-view";
import { StructuredData } from "@/components/structured-data";
import { blogHubMetadata } from "@/lib/seo";

export const metadata: Metadata = blogHubMetadata("en");

export default function Page() {
  return (
    <>
      <StructuredData page="blog" lang="en" />
      <BlogHubView />
    </>
  );
}
