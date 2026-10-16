import type { Lang } from "@/lib/i18n";
import { startPrice, type ServiceSlug } from "@/lib/services";

/**
 * Блог — статті Хвилі 1.
 *
 * Українські тексти — дослівно з `avia-ovh-blog-wave1.md`, англійські — переклад
 * переказом. Як і на сторінках послуг, суми не зашиті в текст, а беруться з
 * тарифів головної через `startPrice`: зміниться тариф — зміниться й стаття.
 *
 * Посилання в тексті записано як `[текст](/шлях)` — компонент перетворює їх на
 * локалізовані <Link>, а для JSON-LD розмітка знімається до чистого тексту.
 * Так видимий FAQ і FAQPage збігаються дослівно, навіть коли у відповіді є
 * посилання. (У вихідному файлі посилання при копіюванні перетворились на
 * `https://claude.ai/...` — за приміткою у файлі це `/contact` і `/services/…`.)
 */

export const BLOG_SLUGS = [
  "skilky-koshtuye-rozrobka-mvp",
  "lending-chy-sajt-kompanii",
  "skilky-koshtuye-rozrobka-sajtu",
  "shcho-take-mvp",
] as const;

export type BlogSlug = (typeof BLOG_SLUGS)[number];

export type Block = { p: string } | { ul: string[] } | { ol: string[] };

export type Article = {
  slug: BlogSlug;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  /** ISO-дата публікації. */
  published: string;
  lead: Block[];
  sections: { h2: string; blocks: Block[] }[];
  faq: { question: string; answer: string }[];
  /** Завершальний абзац із закликом і посиланнями. */
  outro: string;
};

/** Дата першої публікації Хвилі 1. */
const WAVE_1 = "2026-10-07";

function build(lang: Lang): Record<BlogSlug, Article> {
  const price = (slug: ServiceSlug) => startPrice(lang, slug);

  if (lang === "ua") {
    return {
      "skilky-koshtuye-rozrobka-mvp": {
        slug: "skilky-koshtuye-rozrobka-mvp",
        metaTitle: "Скільки коштує розробка MVP у 2026 році: від чого залежить ціна",
        metaDescription:
          "Розбираємо, з чого складається вартість MVP, чому ціни відрізняються в рази і скільки реально закладати бюджету на першу версію продукту.",
        h1: "Скільки коштує розробка MVP і від чого залежить ціна",
        published: WAVE_1,
        lead: [
          {
            p: "Якщо ви шукали вартість розробки MVP, то вже бачили розкид цін від кількох тисяч до сотень тисяч гривень. Це збиває з пантелику: за що одні беруть 50 000, а інші 300 000 за «те саме»? Насправді «те саме» там лише на словах. Нижче розкладаємо, з чого складається ціна MVP і як не переплатити за зайве й не зекономити на головному.",
          },
        ],
        sections: [
          {
            h2: "Що таке MVP і чому це впливає на ціну",
            blocks: [
              {
                p: "MVP (minimum viable product) — це перша версія продукту з мінімальним набором функцій, достатнім, щоб перевірити ідею на реальних користувачах. Ключове слово тут — «мінімальним». Ціна залежить насамперед від того, наскільки чесно ви звузили цей мінімум. Спроба запхати в першу версію «все й одразу» — головна причина, чому бюджети злітають у рази.",
              },
            ],
          },
          {
            h2: "З чого складається вартість MVP",
            blocks: [
              { p: "Вартість формують кілька блоків, і кожен можна масштабувати під бюджет:" },
              {
                ul: [
                  "Discovery й проєктування. Аналіз ідеї, карта ролей, UX-сценарії, пріоритизація функцій. Етап, на якому вирішується, що увійде в перший реліз.",
                  "Дизайн. Від простого функціонального до кастомного під бренд.",
                  "Frontend — те, що бачить користувач.",
                  "Backend, база даних, авторизація — логіка, яка робить продукт продуктом, а не презентацією.",
                  "Інтеграції — платіжки, CRM, сторонні API. Кожна додає роботи.",
                  "Тестування й запуск.",
                ],
              },
              {
                p: "Чим більше ролей, станів і інтеграцій — тим вища ціна. Простий сервіс з однією роллю коштує суттєво менше, ніж маркетплейс із покупцями, продавцями й модерацією.",
              },
            ],
          },
          {
            h2: "Чому ціни відрізняються в рази",
            blocks: [
              { p: "Три головні причини розкиду:" },
              {
                ol: [
                  "Обсяг функціоналу. «MVP» одного замовника — це лендинг із формою, а іншого — платформа з кабінетами. Назва одна, роботи — на порядок більше.",
                  "Глибина опрацювання. Швидкий прототип «аби працювало» і продукт, який потім можна масштабувати без переписування з нуля, — різні бюджети.",
                  "Хто робить. Фрилансер-одинак, студія чи продуктова команда — різний рівень відповідальності, строків і ризику.",
                ],
              },
              {
                p: "Найдешевший варіант часто виявляється найдорожчим: якщо MVP зроблено «на викид», масштабування перетворюється на повну переробку.",
              },
            ],
          },
          {
            h2: "Скільки реально закладати бюджету",
            blocks: [
              {
                p: `Орієнтовно, повноцінна розробка MVP із реальною логікою, базою, авторизацією й базовими інтеграціями стартує від ${price("mvp")}. Простіші сервіси з вузьким функціоналом можуть коштувати менше, складні платформи — суттєво більше. Точну цифру має сенс рахувати лише після discovery, коли зрозумілий scope — будь-яка «ціна наосліп» до цього є вгадуванням.`,
              },
            ],
          },
          {
            h2: "Як не переплатити",
            blocks: [
              {
                p: "Звужуйте перший реліз до того, що реально перевіряє гіпотезу. Усе, що «буде корисно колись», виносьте в наступні ітерації. Хороший підрядник сам підштовхне різати scope, а не навпаки — бо йому важливо, щоб ви швидше вийшли на користувачів і повернулись за розвитком.",
              },
            ],
          },
        ],
        faq: [
          {
            question: "Чи можна зробити MVP дешево?",
            answer: "Можна здешевити, звузивши функціонал і спростивши дизайн. Але економія на архітектурі згодом обертається переписуванням — це дорожче.",
          },
          {
            question: "Скільки часу займає розробка MVP?",
            answer: "Зазвичай 6–10 тижнів залежно від складності. Точні строки — після discovery.",
          },
          {
            question: "Чому не можна назвати ціну одразу?",
            answer: "Бо «MVP» може означати і простий сервіс, і складну платформу. Чесна ціна рахується після того, як узгоджено scope.",
          },
        ],
        outro:
          "Якщо плануєте продукт і хочете зрозуміти реальний бюджет під вашу ідею — [обговоримо задачу](/contact) і дамо scope з орієнтиром. Детальніше про те, що входить у роботу, — на сторінці [розробки MVP](/services/mvp).",
      },

      "lending-chy-sajt-kompanii": {
        slug: "lending-chy-sajt-kompanii",
        metaTitle: "Лендинг чи сайт компанії: що обрати для запуску бізнесу",
        metaDescription:
          "Порівнюємо лендинг і корпоративний сайт: коли достатньо однієї сторінки, а коли потрібен повноцінний сайт. Різниця в цілях, ціні й строках.",
        h1: "Лендинг чи сайт компанії: що обрати для вашого бізнесу",
        published: WAVE_1,
        lead: [
          {
            p: "Перед запуском бізнесу онлайн майже всі впираються в це питання: достатньо односторінкового лендінгу чи одразу робити повноцінний сайт? Помилка в будь-який бік коштує грошей — або переплата за непотрібне, або переробка через пів року. Розберемо, що обрати під вашу ситуацію.",
          },
        ],
        sections: [
          {
            h2: "У чому різниця між лендингом і сайтом компанії",
            blocks: [
              {
                p: "Лендинг — одна сторінка з однією ціллю: показати оффер і зібрати заявки. Весь фокус на конверсії: прийшов — зрозумів — залишив контакт. Сайт компанії — кілька сторінок, що розкривають бізнес: послуги, кейси, про компанію, FAQ, контакти. Ціль ширша: зібрати довіру, покрити більше пошукових запитів, дати клієнту повну картину.",
              },
              { p: "Простими словами: лендинг продає одну дію, сайт — продає компанію." },
            ],
          },
          {
            h2: "Коли достатньо лендінгу",
            blocks: [
              { p: "Лендинг — правильний вибір, якщо:" },
              {
                ul: [
                  "Ви запускаєте одну конкретну послугу чи продукт.",
                  "Треба швидко протестувати попит перед масштабуванням.",
                  "Основний трафік — з реклами, і його треба кудись приземлити.",
                  "Бюджет і строки обмежені, а головне завдання — заявки «тут і зараз».",
                ],
              },
              {
                p: `Це найдешевший і найшвидший спосіб вийти онлайн: запуск за 2–3 тижні, старт від ${price("landing")}.`,
              },
            ],
          },
          {
            h2: "Коли потрібен сайт компанії",
            blocks: [
              { p: "Повноцінний сайт потрібен, якщо:" },
              {
                ul: [
                  "У вас кілька послуг або напрямів, і кожен треба розкрити.",
                  "Важлива довіра: клієнти обирають вас серед конкурентів і вивчають деталі.",
                  "Ви хочете трафік із пошуку під різні запити, а не лише з реклами.",
                  "Бізнес уже сформований, і «односторінкова заглушка» шкодить репутації.",
                ],
              },
              {
                p: `Сайт компанії стартує від ${price("corporate-site")} і робиться довше — бо це більше сторінок, логіки й контенту.`,
              },
            ],
          },
          {
            h2: "Що обрати, якщо сумніваєтесь",
            blocks: [
              {
                p: "Універсальна порада: починайте з лендінгу, якщо треба швидко перевірити ідею або приземлити рекламу; робіть сайт, якщо бізнес уже є й треба будувати довіру й органіку. Важливо обрати підрядника, у якого можна вирости з лендінгу в сайт без зміни команди — тоді перший крок не доведеться викидати.",
              },
            ],
          },
          {
            h2: "Чи можна почати з лендінгу, а потім розширити",
            blocks: [
              {
                p: "Так, і це частий сценарій. Лендинг запускає продажі зараз, а коли бізнес підтверджує попит — сторінка розширюється до повноцінного сайту. Головне, щоб це закладалося архітектурно з самого початку.",
              },
            ],
          },
        ],
        faq: [
          {
            question: "Що дешевше — лендинг чи сайт?",
            answer: `Лендинг. Старт від ${price("landing")} проти від ${price("corporate-site")} за сайт компанії. Але вони вирішують різні задачі.`,
          },
          {
            question: "Чи можна просувати лендинг у Google?",
            answer: "Частково. Одна сторінка ранжується за вузьким колом запитів; для широкого охоплення потрібен сайт із багатьма сторінками.",
          },
          {
            question: "Скільки часу займає кожен варіант?",
            answer: "Лендинг — 2–3 тижні, сайт компанії — 3–5 тижнів і більше залежно від обсягу.",
          },
        ],
        outro:
          "Не впевнені, що підійде під вашу ситуацію? [Опишіть задачу](/contact) — підкажемо. Детальніше: [розробка лендінгу](/services/landing) і [сайт компанії](/services/corporate-site).",
      },

      "skilky-koshtuye-rozrobka-sajtu": {
        slug: "skilky-koshtuye-rozrobka-sajtu",
        metaTitle: "Скільки коштує розробка сайту під ключ: розбір цін по типах",
        metaDescription:
          "Від чого залежить вартість сайту, скільки коштує лендинг, корпоративний сайт і сервіс, і чому «сайт під ключ» може коштувати і 20, і 300 тисяч.",
        h1: "Скільки коштує розробка сайту під ключ",
        published: WAVE_1,
        lead: [
          {
            p: "«Скільки коштує сайт?» — питання, на яке чесна відповідь завжди починається з «залежить». І це не ухиляння: сайтом називають і односторінковий лендинг, і платформу з кабінетами. Розберемо ціни по типах, щоб ви розуміли, за що платите.",
          },
        ],
        sections: [
          {
            h2: "Від чого залежить вартість сайту",
            blocks: [
              { p: "Ціну формують ті самі фактори незалежно від типу:" },
              {
                ul: [
                  "Кількість сторінок і обсяг контенту.",
                  "Складність дизайну — шаблонний чи кастомний під бренд.",
                  "Функціонал — проста форма чи логіка з ролями, фільтрами, оплатою.",
                  "Інтеграції — CRM, платіжки, сторонні сервіси.",
                  "SEO-підготовка й адаптивність.",
                ],
              },
              {
                p: "Що більше всього цього — то вища ціна. Тому порівнювати «ціну сайту» без типу й scope — безглуздо.",
              },
            ],
          },
          {
            h2: "Скільки коштує лендинг",
            blocks: [
              {
                p: `Односторінковий сайт під одну ціль. Старт від ${price("landing")}, запуск за 2–3 тижні. Підходить для запуску послуги, тесту попиту й приземлення реклами. Детальніше — на сторінці [розробки лендінгу](/services/landing).`,
              },
            ],
          },
          {
            h2: "Скільки коштує сайт компанії",
            blocks: [
              {
                p: `Багатосторінковий сайт: послуги, кейси, про компанію, контакти, SEO. Старт від ${price("corporate-site")}. Робиться довше, бо більше сторінок і контенту. Це вибір бізнесу, якому потрібні довіра й органічний трафік. Детальніше — [сайт компанії](/services/corporate-site).`,
              },
            ],
          },
          {
            h2: "Скільки коштує сайт із логікою (MVP / сервіс)",
            blocks: [
              {
                p: `Коли сайт — це вже продукт із ролями, базою даних, авторизацією й реальною роботою (кабінети, сервіси, платформи), це інший рівень. Старт від ${price("mvp")}, бо тут frontend, backend, база та інтеграції. Детальніше — [розробка MVP](/services/mvp).`,
              },
            ],
          },
          {
            h2: "Чому «сайт під ключ» коштує і 20, і 300 тисяч",
            blocks: [
              {
                p: "Бо під «ключем» ховається різний обсяг. Лендинг «під ключ» — це сторінка з формою. Сервіс «під ключ» — це працюючий продукт із логікою. Коли порівнюєте пропозиції, дивіться не на слово «під ключ», а на те, що конкретно входить: скільки сторінок, яка логіка, які інтеграції, чи є SEO й підтримка.",
              },
            ],
          },
          {
            h2: "Як отримати точну ціну",
            blocks: [
              {
                p: "Точний кошторис дають після брифу чи discovery, коли зрозумілий scope. Будь-яка цифра до цього — орієнтир, а не фінальна ціна. Хороший підрядник показує стартову вартість публічно й узгоджує фінальну до оплати, без «уточнюйте в менеджера».",
              },
            ],
          },
        ],
        faq: [
          {
            question: "Чому ціну не кажуть одразу?",
            answer: "Бо «сайт» — це і лендинг, і платформа. Чесна ціна рахується після того, як зрозумілий обсяг.",
          },
          {
            question: "Що впливає на ціну найбільше?",
            answer: "Функціонал та інтеграції. Дизайн і кількість сторінок теж важливі, але логіка дорожчає найшвидше.",
          },
          {
            question: "Чи входить SEO у вартість?",
            answer: "Базова технічна SEO-підготовка — так. Просування контентом і посиланнями — окремий етап.",
          },
        ],
        outro:
          "Хочете точну цифру під свою задачу? [Опишіть проєкт](/contact) — дамо scope з орієнтиром.",
      },

      "shcho-take-mvp": {
        slug: "shcho-take-mvp",
        metaTitle: "Що таке MVP і навіщо він потрібен стартапу: простими словами",
        metaDescription:
          "Пояснюємо на пальцях, що таке MVP, навіщо він стартапу, чим відрізняється від прототипу й повного продукту, і які помилки роблять найчастіше.",
        h1: "Що таке MVP і навіщо він потрібен стартапу",
        published: WAVE_1,
        lead: [
          {
            p: "Слово MVP звучить на кожному кроці в стартап-середовищі, але за ним часто не стоїть чіткого розуміння. Розберемо простими словами, що це, навіщо й чому саме з MVP варто починати продукт, а не з «ідеального застосунку одразу».",
          },
        ],
        sections: [
          {
            h2: "Що означає MVP",
            blocks: [
              {
                p: "MVP (minimum viable product) — мінімально життєздатний продукт. Це найпростіша версія продукту, яка вже вирішує головну задачу користувача й дозволяє перевірити, чи потрібен він людям взагалі. Не «урізана» й не «недороблена» версія, а свідомо сфокусована: лише те, що перевіряє ключову гіпотезу.",
              },
              {
                p: "Класична аналогія: якщо кінцева мета — автомобіль, MVP це не «машина без дверей», а самокат. Він теж вирішує задачу «дістатися з точки А в Б», але дешево й швидко, щоб перевірити, чи людям взагалі треба кудись їхати.",
              },
            ],
          },
          {
            h2: "Навіщо стартапу MVP",
            blocks: [
              { p: "Головна причина — зменшити ризик витратити рік і бюджет на те, що нікому не потрібно. MVP дозволяє:" },
              {
                ul: [
                  "перевірити попит на реальних користувачах, а не на здогадках;",
                  "отримати зворотний зв'язок рано, поки зміни дешеві;",
                  "вийти на ринок швидше за конкурентів;",
                  "показати працюючий продукт інвесторам замість презентації.",
                ],
              },
              {
                p: "Статистика невблаганна: більшість стартапів помирає не через погану реалізацію, а тому що зробили продукт, який ринку не потрібен. MVP — це страховка від цього.",
              },
            ],
          },
          {
            h2: "Чим MVP відрізняється від прототипу й повного продукту",
            blocks: [
              {
                ul: [
                  "Прототип — це макет, який показує, як виглядатиме продукт. Він не працює по-справжньому, це демонстрація.",
                  "MVP — це вже працюючий продукт із мінімальним функціоналом. Ним реально користуються.",
                  "Повний продукт — MVP, який після перевірки гіпотез обріс функціями, інтеграціями й доопрацюваннями.",
                ],
              },
              { p: "Послідовність зазвичай така: ідея → прототип → MVP → повний продукт." },
            ],
          },
          {
            h2: "Які помилки роблять найчастіше",
            blocks: [
              {
                ol: [
                  "Роздувають MVP. Намагаються втиснути «все одразу» — і MVP перестає бути minimum, бюджет і строки злітають.",
                  "Плутають MVP з чернеткою. Роблять настільки сиро, що користувачі не можуть нормально протестувати — і зворотний зв'язок виходить хибним.",
                  "Не закладають масштабування. Зекономили на архітектурі — і при розвитку доводиться переписувати з нуля.",
                ],
              },
              { p: "Баланс між «достатньо просто» і «достатньо якісно» — головне мистецтво в MVP." },
            ],
          },
          {
            h2: "З чого почати",
            blocks: [
              {
                p: "Почніть з однієї головної гіпотези: яку проблему й для кого ви вирішуєте. Визначте мінімальний набір функцій, що її перевіряє, — і все інше відкладіть. Далі — discovery, пріоритизація й розробка першої версії.",
              },
            ],
          },
        ],
        faq: [
          {
            question: "Скільки коштує розробка MVP?",
            answer: `Орієнтовно від ${price("mvp")} залежно від складності. Точна ціна — після discovery. Детальніше в [окремій статті про ціну MVP](/blog/skilky-koshtuye-rozrobka-mvp).`,
          },
          {
            question: "Скільки часу займає MVP?",
            answer: "Зазвичай 6–10 тижнів. Залежить від кількості ролей та інтеграцій.",
          },
          {
            question: "Чи можна зробити MVP самому без розробників?",
            answer: "Для простих ідей — через no-code інструменти так. Для продукту з реальною логікою й масштабуванням потрібна розробка.",
          },
        ],
        outro:
          "Є ідея продукту й хочете перевірити її працюючим MVP? [Обговоримо задачу](/contact). Що входить у роботу — на сторінці [розробки MVP](/services/mvp).",
      },
    };
  }

  return {
    "skilky-koshtuye-rozrobka-mvp": {
      slug: "skilky-koshtuye-rozrobka-mvp",
      metaTitle: "How much does MVP development cost in 2026: what drives the price",
      metaDescription:
        "What MVP development cost is made of, why quotes differ several times over and how much to budget for the first version of your product.",
      h1: "How much MVP development costs and what drives the price",
      published: WAVE_1,
      lead: [
        {
          p: "If you've looked up MVP development costs, you've seen quotes ranging from a few thousand to hundreds of thousands of hryvnias. It's confusing: why does one team ask 50,000 and another 300,000 for \"the same thing\"? In reality it's only the same on paper. Below we break down what an MVP price is made of — and how to avoid overpaying for extras or cutting corners on what matters.",
        },
      ],
      sections: [
        {
          h2: "What is an MVP and why does it affect the price",
          blocks: [
            {
              p: "An MVP (minimum viable product) is the first version of a product with just enough features to test the idea on real users. The key word is \"minimum\". The price depends first of all on how honestly you've narrowed that minimum down. Trying to cram \"everything at once\" into the first version is the main reason budgets balloon.",
            },
          ],
        },
        {
          h2: "What makes up the cost of an MVP",
          blocks: [
            { p: "The cost is built from several blocks, and each can be scaled to the budget:" },
            {
              ul: [
                "Discovery and design thinking. Analysing the idea, a role map, UX flows, feature prioritisation. This is where you decide what goes into the first release.",
                "Design. From plain and functional to fully custom for your brand.",
                "Frontend — what the user sees.",
                "Backend, database, authentication — the logic that makes a product a product, not a pitch deck.",
                "Integrations — payments, CRM, third-party APIs. Each one adds work.",
                "Testing and launch.",
              ],
            },
            {
              p: "The more roles, states and integrations, the higher the price. A simple service with one role costs far less than a marketplace with buyers, sellers and moderation.",
            },
          ],
        },
        {
          h2: "Why do prices differ several times over",
          blocks: [
            { p: "Three main reasons for the spread:" },
            {
              ol: [
                "Scope. One client's \"MVP\" is a landing page with a form; another's is a platform with user accounts. Same name, an order of magnitude more work.",
                "Depth. A quick \"just make it work\" prototype and a product you can later scale without rewriting from scratch are different budgets.",
                "Who builds it. A solo freelancer, a studio or a product team — different levels of accountability, timelines and risk.",
              ],
            },
            {
              p: "The cheapest option often turns out to be the most expensive: if the MVP was built to be thrown away, scaling it means rebuilding it entirely.",
            },
          ],
        },
        {
          h2: "How much should you actually budget",
          blocks: [
            {
              p: `As a guide, a full MVP with real logic, a database, authentication and basic integrations starts from ${price("mvp")}. Simpler services with narrow functionality can cost less; complex platforms cost considerably more. An exact figure only makes sense after discovery, once the scope is clear — any "blind price" before that is guesswork.`,
            },
          ],
        },
        {
          h2: "How to avoid overpaying",
          blocks: [
            {
              p: "Narrow the first release down to what actually tests your hypothesis. Anything that \"might be useful someday\" goes into later iterations. A good contractor will push you to cut scope, not the other way round — because they want you to reach users sooner and come back to grow the product.",
            },
          ],
        },
      ],
      faq: [
        {
          question: "Can an MVP be built cheaply?",
          answer: "You can make it cheaper by narrowing the features and simplifying the design. But saving on architecture means rewriting later — and that costs more.",
        },
        {
          question: "How long does MVP development take?",
          answer: "Usually 6–10 weeks depending on complexity. Exact timelines come after discovery.",
        },
        {
          question: "Why can't you name a price straight away?",
          answer: "Because \"MVP\" can mean anything from a simple service to a complex platform. An honest price is calculated once the scope is agreed.",
        },
      ],
      outro:
        "Planning a product and want to know the real budget for your idea? [Let's discuss the task](/contact) and we'll come back with a scope and an estimate. More on what the work includes on the [MVP development](/services/mvp) page.",
    },

    "lending-chy-sajt-kompanii": {
      slug: "lending-chy-sajt-kompanii",
      metaTitle: "Landing page or company website: which to choose for a launch",
      metaDescription:
        "Landing page vs company website: when one page is enough and when you need a full site. The difference in goals, price and timelines.",
      h1: "Landing page or company website: which is right for your business",
      published: WAVE_1,
      lead: [
        {
          p: "Before taking a business online, almost everyone hits the same question: is a one-page landing enough, or should you build a full website right away? Getting it wrong either way costs money — you either overpay for things you don't need or rebuild six months later. Let's work out what fits your situation.",
        },
      ],
      sections: [
        {
          h2: "What is the difference between a landing page and a company website",
          blocks: [
            {
              p: "A landing page is one page with one goal: present the offer and collect leads. Everything is about conversion: arrive, understand, leave your contact. A company website is several pages that tell the story of the business: services, case studies, about us, FAQ, contacts. The goal is broader: build trust, cover more search queries and give the client the full picture.",
            },
            { p: "Put simply: a landing page sells one action; a website sells the company." },
          ],
        },
        {
          h2: "When is a landing page enough",
          blocks: [
            { p: "A landing page is the right choice if:" },
            {
              ul: [
                "You're launching one specific service or product.",
                "You need to test demand quickly before scaling.",
                "Most of your traffic comes from ads and needs somewhere to land.",
                "Budget and time are tight, and the main job is leads here and now.",
              ],
            },
            {
              p: `It's the cheapest and fastest way to get online: live in 2–3 weeks, from ${price("landing")}.`,
            },
          ],
        },
        {
          h2: "When do you need a company website",
          blocks: [
            { p: "You need a full website if:" },
            {
              ul: [
                "You have several services or lines of business, and each needs explaining.",
                "Trust matters: clients choose you among competitors and study the details.",
                "You want search traffic for a range of queries, not just ad traffic.",
                "The business is established, and a one-page placeholder hurts your reputation.",
              ],
            },
            {
              p: `A company website starts from ${price("corporate-site")} and takes longer — because it means more pages, logic and content.`,
            },
          ],
        },
        {
          h2: "What to choose if you're unsure",
          blocks: [
            {
              p: "The general rule: start with a landing page if you need to test an idea quickly or give your ads a place to land; build a website if the business already exists and you need to build trust and organic traffic. It's important to pick a contractor you can grow with from a landing page to a website without changing teams — that way the first step never has to be thrown away.",
            },
          ],
        },
        {
          h2: "Can you start with a landing page and expand later",
          blocks: [
            {
              p: "Yes, and it's a common path. The landing page starts selling now, and once the business proves demand the page grows into a full website. The key is to plan for that in the architecture from the start.",
            },
          ],
        },
      ],
      faq: [
        {
          question: "Which is cheaper — a landing page or a website?",
          answer: `A landing page. From ${price("landing")} versus from ${price("corporate-site")} for a company website. But they solve different problems.`,
        },
        {
          question: "Can a landing page be promoted in Google?",
          answer: "Partly. One page ranks for a narrow set of queries; for broad reach you need a website with many pages.",
        },
        {
          question: "How long does each option take?",
          answer: "A landing page takes 2–3 weeks; a company website 3–5 weeks or more depending on scope.",
        },
      ],
      outro:
        "Not sure what fits your situation? [Describe the task](/contact) and we'll advise. More detail: [landing page development](/services/landing) and [company websites](/services/corporate-site).",
    },

    "skilky-koshtuye-rozrobka-sajtu": {
      slug: "skilky-koshtuye-rozrobka-sajtu",
      metaTitle: "How much does a turnkey website cost: prices by type",
      metaDescription:
        "What drives the cost of a website, what a landing page, a company website and a web service cost, and why a turnkey site can cost 20k or 300k.",
      h1: "How much does turnkey website development cost",
      published: WAVE_1,
      lead: [
        {
          p: "\"How much does a website cost?\" The honest answer always starts with \"it depends\". That's not evasion: the word \"website\" covers everything from a one-page landing to a platform with user accounts. Let's go through prices by type so you know what you're paying for.",
        },
      ],
      sections: [
        {
          h2: "What does the cost of a website depend on",
          blocks: [
            { p: "The price is shaped by the same factors whatever the type:" },
            {
              ul: [
                "The number of pages and the amount of content.",
                "Design complexity — template-based or custom for your brand.",
                "Functionality — a simple form or logic with roles, filters and payments.",
                "Integrations — CRM, payments, third-party services.",
                "SEO groundwork and responsiveness.",
              ],
            },
            {
              p: "The more of all this, the higher the price. That's why comparing \"website prices\" without the type and scope is meaningless.",
            },
          ],
        },
        {
          h2: "How much does a landing page cost",
          blocks: [
            {
              p: `A one-page site with a single goal. From ${price("landing")}, live in 2–3 weeks. Suits launching a service, testing demand and giving ads a place to land. More on the [landing page development](/services/landing) page.`,
            },
          ],
        },
        {
          h2: "How much does a company website cost",
          blocks: [
            {
              p: `A multi-page site: services, case studies, about us, contacts, SEO. From ${price("corporate-site")}. It takes longer because there are more pages and more content. It's the choice for a business that needs trust and organic traffic. More: [company websites](/services/corporate-site).`,
            },
          ],
        },
        {
          h2: "How much does a website with logic cost (MVP / web service)",
          blocks: [
            {
              p: `When the website is already a product with roles, a database, authentication and real work behind it (user accounts, services, platforms), it's a different level. From ${price("mvp")}, because it involves frontend, backend, a database and integrations. More: [MVP development](/services/mvp).`,
            },
          ],
        },
        {
          h2: "Why can a turnkey website cost 20k or 300k",
          blocks: [
            {
              p: "Because \"turnkey\" hides very different scopes. A turnkey landing page is a page with a form. A turnkey service is a working product with logic. When comparing offers, don't look at the word \"turnkey\" — look at exactly what's included: how many pages, what logic, which integrations, whether SEO and support are part of it.",
            },
          ],
        },
        {
          h2: "How do you get an exact price",
          blocks: [
            {
              p: "An exact quote comes after a brief or discovery, once the scope is clear. Any figure before that is a guide, not a final price. A good contractor publishes starting prices openly and agrees the final one before payment — never \"ask our manager\".",
            },
          ],
        },
      ],
      faq: [
        {
          question: "Why won't anyone name a price straight away?",
          answer: "Because a \"website\" can be a landing page or a platform. An honest price is calculated once the scope is clear.",
        },
        {
          question: "What affects the price the most?",
          answer: "Functionality and integrations. Design and page count matter too, but logic gets expensive fastest.",
        },
        {
          question: "Is SEO included in the price?",
          answer: "Basic technical SEO groundwork — yes. Content and link building are a separate stage.",
        },
      ],
      outro:
        "Want an exact figure for your task? [Describe the project](/contact) and we'll come back with a scope and an estimate.",
    },

    "shcho-take-mvp": {
      slug: "shcho-take-mvp",
      metaTitle: "What is an MVP and why does a startup need one: in plain words",
      metaDescription:
        "What an MVP is, why a startup needs one, how it differs from a prototype and a full product, and the mistakes people make most often.",
      h1: "What is an MVP and why does a startup need one",
      published: WAVE_1,
      lead: [
        {
          p: "You hear \"MVP\" at every turn in the startup world, but there often isn't a clear understanding behind it. Let's explain in plain words what it is, why it matters and why a product should start with an MVP rather than \"the perfect app straight away\".",
        },
      ],
      sections: [
        {
          h2: "What does MVP mean",
          blocks: [
            {
              p: "MVP stands for minimum viable product. It's the simplest version of a product that already solves the user's main problem and lets you check whether people need it at all. Not a \"cut-down\" or \"unfinished\" version, but a deliberately focused one: only what tests the key hypothesis.",
            },
            {
              p: "The classic analogy: if the end goal is a car, the MVP isn't \"a car without doors\" — it's a scooter. It also solves \"getting from A to B\", but cheaply and quickly, so you can check whether people want to go anywhere at all.",
            },
          ],
        },
        {
          h2: "Why does a startup need an MVP",
          blocks: [
            { p: "The main reason is to reduce the risk of spending a year and a budget on something nobody needs. An MVP lets you:" },
            {
              ul: [
                "test demand on real users instead of assumptions;",
                "get feedback early, while changes are still cheap;",
                "reach the market faster than competitors;",
                "show investors a working product instead of a slide deck.",
              ],
            },
            {
              p: "The numbers are unforgiving: most startups die not from poor execution but because they built a product the market didn't need. An MVP is insurance against that.",
            },
          ],
        },
        {
          h2: "How is an MVP different from a prototype and a full product",
          blocks: [
            {
              ul: [
                "A prototype is a mock-up that shows what the product will look like. It doesn't really work — it's a demonstration.",
                "An MVP is already a working product with minimal functionality. People actually use it.",
                "A full product is an MVP that, after the hypotheses were tested, grew features, integrations and refinements.",
              ],
            },
            { p: "The usual sequence: idea → prototype → MVP → full product." },
          ],
        },
        {
          h2: "What are the most common mistakes",
          blocks: [
            {
              ol: [
                "Inflating the MVP. Trying to squeeze in \"everything at once\" — and the MVP stops being minimum while budget and timelines soar.",
                "Confusing an MVP with a draft. Making it so rough that users can't test it properly — and the feedback comes out wrong.",
                "Not planning for scale. Saving on architecture means rewriting from scratch as the product grows.",
              ],
            },
            { p: "The balance between \"simple enough\" and \"good enough\" is the real art of an MVP." },
          ],
        },
        {
          h2: "Where to start",
          blocks: [
            {
              p: "Start with one main hypothesis: what problem you're solving and for whom. Define the minimum set of features that tests it — and put everything else aside. Then comes discovery, prioritisation and building the first version.",
            },
          ],
        },
      ],
      faq: [
        {
          question: "How much does MVP development cost?",
          answer: `As a guide, from ${price("mvp")} depending on complexity. The exact price comes after discovery. More in a [separate article on MVP pricing](/blog/skilky-koshtuye-rozrobka-mvp).`,
        },
        {
          question: "How long does an MVP take?",
          answer: "Usually 6–10 weeks. It depends on the number of roles and integrations.",
        },
        {
          question: "Can I build an MVP myself without developers?",
          answer: "For simple ideas — yes, with no-code tools. A product with real logic and room to scale needs development.",
        },
      ],
      outro:
        "Have a product idea and want to test it with a working MVP? [Let's discuss the task](/contact). What the work includes — on the [MVP development](/services/mvp) page.",
    },
  };
}

const CACHE: Partial<Record<Lang, Record<BlogSlug, Article>>> = {};

export function getArticles(lang: Lang) {
  return (CACHE[lang] ??= build(lang));
}

export function getArticle(lang: Lang, slug: BlogSlug) {
  return getArticles(lang)[slug];
}

export function isBlogSlug(value: string): value is BlogSlug {
  return (BLOG_SLUGS as readonly string[]).includes(value);
}

/** «[текст](/шлях)» → «текст»: для JSON-LD і метаданих. */
export function plainText(value: string) {
  return value.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

/** Розбиває рядок на текст і посилання для рендеру. */
export function splitLinks(value: string) {
  const parts: ({ text: string } | { text: string; href: string })[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  for (let match = re.exec(value); match; match = re.exec(value)) {
    if (match.index > last) parts.push({ text: value.slice(last, match.index) });
    parts.push({ text: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < value.length) parts.push({ text: value.slice(last) });
  return parts;
}

/**
 * «7 жовтня 2026» / «7 October 2026». Вручну, а не через toLocaleDateString:
 * назви місяців і формат у Node та в браузері можуть відрізнятись, і це дало б
 * розбіжність гідратації.
 */
const MONTHS = {
  ua: ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
} as const;

export function formatDate(lang: Lang, iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[lang][month - 1]} ${year}`;
}

/**
 * Зворотна перелінковка: які статті показувати на сторінці послуги.
 * Інтеграції поки без статей — блок там не показується.
 */
export const ARTICLES_FOR_SERVICE: Record<ServiceSlug, BlogSlug[]> = {
  landing: ["lending-chy-sajt-kompanii", "skilky-koshtuye-rozrobka-sajtu"],
  "corporate-site": ["lending-chy-sajt-kompanii", "skilky-koshtuye-rozrobka-sajtu"],
  mvp: ["skilky-koshtuye-rozrobka-mvp", "shcho-take-mvp"],
  integrations: [],
};

/** Тексти хабу й спільних підписів. */
export const BLOG_HUB = {
  ua: {
    name: "Блог",
    metaTitle: "Блог AVIA Digital: ціни на розробку, MVP і сайти",
    metaDescription:
      "Статті про те, скільки коштує розробка сайту й MVP, що обрати — лендинг чи сайт компанії, і як не переплатити. Пишемо з практики AVIA Digital.",
    eyebrow: "Блог",
    title: "Статті про розробку",
    sub: "Розбираємо ціни, формати й рішення, з якими до нас найчастіше приходять клієнти.",
    published: "Опубліковано",
    author: "Автор: команда AVIA Digital",
    authorName: "Команда AVIA Digital",
    read: "Читати статтю",
    faqTitle: "Часті питання",
    useful: "Корисні статті",
    all: "Усі статті",
  },
  en: {
    name: "Blog",
    metaTitle: "AVIA Digital blog: development pricing, MVPs and websites",
    metaDescription:
      "Articles on what website and MVP development cost, landing page vs company website, and how to avoid overpaying. Written from AVIA Digital practice.",
    eyebrow: "Blog",
    title: "Articles on development",
    sub: "We break down the prices, formats and decisions clients most often bring to us.",
    published: "Published",
    author: "By the AVIA Digital team",
    authorName: "AVIA Digital team",
    read: "Read the article",
    faqTitle: "FAQ",
    useful: "Useful articles",
    all: "All articles",
  },
} as const;
