/*
 * Сторінка задає власний openGraph у metadata, а Next не зливає його з
 * батьківським, а замінює повністю — разом із картинкою з кореневого
 * opengraph-image. Тому сегмент підключає ту саму картинку явно.
 */
export { default, alt, size, contentType } from "../../opengraph-image";

import { SERVICE_SLUGS } from "@/lib/services";

/** Без цього картинку в динамічному сегменті Next рендерив би на кожен запит. */
export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}
