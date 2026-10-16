/*
 * Сторінка задає власний openGraph у metadata, а Next не зливає його з
 * батьківським, а замінює повністю — разом із картинкою з кореневого
 * opengraph-image. Тому сегмент підключає ту саму картинку явно.
 */
import { BLOG_SLUGS } from "@/lib/blog";

export { default, alt, size, contentType } from "../../opengraph-image";

/** Без цього картинку в динамічному сегменті Next рендерив би на кожен запит. */
export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}
