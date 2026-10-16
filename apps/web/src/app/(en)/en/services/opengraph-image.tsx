/*
 * Сторінка задає власний openGraph у metadata, а Next не зливає його з
 * батьківським, а замінює повністю — разом із картинкою з кореневого
 * opengraph-image. Тому сегмент підключає ту саму картинку явно.
 */
export { default, alt, size, contentType } from "../opengraph-image";
