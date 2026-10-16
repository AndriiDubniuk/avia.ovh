import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleView } from "@/components/article-view";
import { StructuredData } from "@/components/structured-data";
import { BLOG_SLUGS, isBlogSlug } from "@/lib/blog";
import { articleMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

/** Статті генеруються при збірці; будь-який інший slug — 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return isBlogSlug(slug) ? articleMetadata("en", slug) : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!isBlogSlug(slug)) notFound();

  return (
    <>
      <StructuredData page="article" lang="en" article={slug} />
      <ArticleView slug={slug} />
    </>
  );
}
