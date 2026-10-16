/*
 * Підсторінка задає власний openGraph у metadata, а Next не зливає його з
 * батьківським, а замінює повністю — разом із картинкою з кореневого
 * opengraph-image. Тому кожна підсторінка підключає ту саму картинку явно.
 * Посилання вручну (https://avia.ovh/opengraph-image) не підійшло б: Next
 * віддає картинку за хешованою адресою, а голий шлях дає 404.
 */
export { default, alt, size, contentType } from "../opengraph-image";
