/**
 * Технічні тексти не мають доходити до користувача.
 *
 * fetch() кидає TypeError("Failed to fetch") при обриві мережі — раніше цей
 * рядок показувався прямо у формі. Показуємо повідомлення сервера лише тоді,
 * коли воно справді призначене людині.
 */

const TECHNICAL =
  /failed to fetch|networkerror|load failed|typeerror|referenceerror|syntaxerror|\[object |undefined|null|ECONNREFUSED|fetch failed/i;

/** Схоже на службовий текст: латиниця, código, стек. */
function looksTechnical(message: string) {
  if (!message.trim()) return true;
  if (TECHNICAL.test(message)) return true;
  // Немає жодної кирилиці — майже напевно повідомлення бібліотеки, а не наше.
  return !/[а-яіїєґ]/i.test(message);
}

/** Прибирає хвіст на кшталт "(500)" з повідомлень, що прийшли від API. */
function stripStatus(message: string) {
  return message.replace(/\s*\(\d{3}\)\s*\.?$/, ".").trim();
}

export function userMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const message = stripStatus(error.message);
  return looksTechnical(message) ? fallback : message;
}
