import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceView } from "@/components/service-view";
import { StructuredData } from "@/components/structured-data";
import { serviceMetadata } from "@/lib/seo";
import { isServiceSlug, SERVICE_SLUGS } from "@/lib/services";

type Props = { params: Promise<{ slug: string }> };

/** Чотири сторінки генеруються при збірці; будь-який інший slug — 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return isServiceSlug(slug) ? serviceMetadata("ua", slug) : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!isServiceSlug(slug)) notFound();

  return (
    <>
      <StructuredData page="service" lang="ua" service={slug} />
      <ServiceView slug={slug} />
    </>
  );
}
