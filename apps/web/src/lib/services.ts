import { DICT, type Lang } from "@/lib/i18n";

/**
 * Посадкові сторінки послуг.
 *
 * Українські тексти — з погодженого копірайту (`avia-ovh-landing-copy.md`),
 * англійські — переклад. Два свідомі відступи від копірайту:
 *
 * 1. Ціни не зашиті в текст, а беруться з тарифів головної (`DICT.fares`).
 *    У копірайті були інші суми, ніж у публічних тарифах сайту; дві різні
 *    ціни на ту саму послугу на одному сайті — пряма претензія клієнта.
 *    Для інтеграцій окремого тарифу немає — там ціни немає взагалі.
 * 2. «Що входить» у копірайті — перелік через кому. Для розмітки потрібен
 *    справжній список, тож пункти розбито й поставлено в називний відмінок.
 *
 * Видимий FAQ і FAQPage у JSON-LD будуються з тих самих рядків, тож розійтися
 * не можуть.
 */

export const SERVICE_SLUGS = [
  "landing",
  "corporate-site",
  "mvp",
  "integrations",
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

type Related = ServiceSlug;

export type ServiceContent = {
  slug: ServiceSlug;
  /** Коротка назва — для хлібних крихт, меню й карток. */
  name: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  when: { title: string; text: string };
  includes: { title: string; items: string[]; note?: string };
  process: { title: string; steps?: string[]; text?: string };
  cost: { title: string; text: string };
  faq: { question: string; answer: string }[];
  cta: string;
  related: Related[];
  /** Стартова ціна для Schema.org; null — тарифу немає. */
  minPrice: number | null;
};

/** Індекс тарифу в `DICT.fares.packs`: Лендінг, Сайт компанії, …, MVP. */
const PACK: Record<ServiceSlug, number | null> = {
  landing: 0,
  "corporate-site": 1,
  mvp: 3,
  integrations: null,
};

function packNumber(lang: Lang, slug: ServiceSlug) {
  const index = PACK[slug];
  if (index === null) return null;
  return Number(DICT[lang].fares.packs[index].price.replace(/[^\d]/g, ""));
}

/**
 * «22 500 грн» / «₴22,500». Форматуємо вручну, а не через toLocaleString:
 * роздільник тисяч у Node і в браузері різний (U+00A0 проти U+202F), і це
 * дало б розбіжність гідратації. `nbsp` — у тексті сторінки, щоб сума не
 * розривалась між рядками; у метаописі — звичайний пробіл.
 */
function money(lang: Lang, value: number, nbsp: boolean) {
  const space = nbsp ? " " : " ";
  const grouped = String(value).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    lang === "ua" ? space : ",",
  );
  return lang === "ua" ? `${grouped}${space}грн` : `₴${grouped}`;
}

/**
 * Стартова ціна тарифу для тексту: «22 500 грн» / «₴22,500». Нею користується
 * й блог — тож суми в статтях беруться з того самого джерела, що й тарифи.
 */
export function startPrice(lang: Lang, slug: ServiceSlug, nbsp = true) {
  const value = packNumber(lang, slug);
  return value === null ? "" : money(lang, value, nbsp);
}

function build(lang: Lang): Record<ServiceSlug, ServiceContent> {
  const price = (slug: ServiceSlug, nbsp = true) => {
    const value = packNumber(lang, slug);
    return value === null ? "" : money(lang, value, nbsp);
  };

  if (lang === "ua") {
    return {
      landing: {
        slug: "landing",
        name: "Лендінги",
        metaTitle: "Розробка лендінгу під ключ за 2–3 тижні | AVIA Digital",
        metaDescription: `Замовити лендинг для послуги, реклами чи тесту попиту. Структура, продаючі тексти, адаптив, SEO-база, форма заявки. Старт від ${price("landing", false)}.`,
        h1: "Розробка лендінгу під ключ, що готовий продавати",
        intro: `Робимо лендінги, з якими можна одразу запускати рекламу й приймати заявки. Не «красива сторінка заради сторінки», а зрозуміла структура під конверсію: оффер, вигоди, докази, форма. Запуск за 2–3 тижні, стартова ціна від ${price("landing")}.`,
        when: {
          title: "Коли потрібен лендинг",
          text: "Коли треба швидко запустити нову послугу чи продукт, протестувати попит перед масштабуванням, зробити посадкову під рекламну кампанію або показати оффер холодному трафіку. Якщо ціль — зібрати заявки чи перевірити ідею без великого бюджету, лендинг закриває це найдешевше і найшвидше.",
        },
        includes: {
          title: "Що входить у розробку",
          items: [
            "Прототип і структура під конверсію",
            "Продаючі тексти й оффер",
            "Адаптивна верстка під мобільні",
            "Базове SEO: мета-теги, швидкість, мікророзмітка",
            "Форма заявки з інтеграцією у ваш канал",
            "Підключення аналітики й домену",
          ],
          note: "За потреби додаємо платіжний сценарій або онлайн-оплату прямо на сторінці.",
        },
        process: {
          title: "Як проходить робота",
          steps: [
            "Бриф — уточнюємо продукт, ціль, цільову аудиторію й дедлайн.",
            "Прототип — узгоджуємо структуру блоків і логіку конверсії.",
            "Дизайн — малюємо під ваш бренд, показуємо до верстки.",
            "Верстка — адаптив, швидкість, інтеграції.",
            "Запуск — підключаємо домен, аналітику, передаємо доступи.",
          ],
        },
        cost: {
          title: "Скільки коштує",
          text: `Старт від ${price("landing")}. Фінальна ціна залежить від кількості блоків, складності дизайну та інтеграцій. Точний кошторис даємо після брифу — завжди до оплати, без «уточнюйте в менеджера».`,
        },
        faq: [
          {
            question: "Скільки часу займає розробка лендінгу?",
            answer: "Зазвичай 2–3 тижні від брифу до запуску, залежно від обсягу й швидкості зворотного зв'язку.",
          },
          {
            question: "Чи пишете тексти самі?",
            answer: "Так, пишемо продаючі тексти під ваш оффер. Від вас — вхідна інформація про продукт.",
          },
          {
            question: "Чи можна потім дорости до повноцінного сайту?",
            answer: "Так. Лендинг можна розширити до сайту компанії або сервісу без зміни підрядника.",
          },
          {
            question: "Що потрібно від мене на старті?",
            answer: "Короткий бриф: що за продукт, хто клієнт, яка ціль сторінки. Решту проведемо самі.",
          },
        ],
        cta: "Обговорити лендинг",
        related: ["mvp", "integrations"],
        minPrice: packNumber(lang, "landing"),
      },

      "corporate-site": {
        slug: "corporate-site",
        name: "Сайти компаній",
        metaTitle: "Розробка сайту компанії під ключ | AVIA Digital",
        metaDescription: `Створення корпоративного сайту: послуги, кейси, FAQ, контакти, SEO. Збираємо довіру до бізнесу й готуємо до трафіку й заявок. Старт від ${price("corporate-site", false)}.`,
        h1: "Розробка сайту компанії, що викликає довіру",
        intro: `Робимо сайти, які продають вашу компанію: зрозуміла подача послуг, кейси, відповіді на питання клієнта й нормальна точка входу для заявок. Не шаблонна «візитка», а керований сайт, готовий до реклами й SEO. Старт від ${price("corporate-site")}.`,
        when: {
          title: "Коли потрібен сайт компанії",
          text: "Коли одного лендінгу вже мало: треба показати повний спектр послуг, зібрати кейси й докази, відповісти на питання клієнта й виглядати як серйозний бізнес, а не тимчасова сторінка. Це основа для довіри, трафіку й повторних звернень.",
        },
        includes: {
          title: "Що входить",
          items: [
            "Карта сторінок і структура під ваш бізнес",
            "Дизайн під бренд",
            "Керовані контентні блоки",
            "Сторінки послуг і кейсів",
            "Розділ «Про компанію»",
            "Контакти й правові сторінки",
            "Базове SEO та підготовка до трафіку, заявок і онлайн-оплати",
          ],
        },
        process: {
          title: "Як проходить робота",
          text: "Від брифу й карти сторінок — через дизайн і збірку — до запуску й передачі. Показуємо проміжний результат на кожному етапі, без сюрпризів у фіналі.",
        },
        cost: {
          title: "Скільки коштує",
          text: `Старт від ${price("corporate-site")}. Ціна залежить від кількості сторінок, складності дизайну, контентних блоків та інтеграцій. Точний кошторис — після брифу, до оплати.`,
        },
        faq: [
          {
            question: "Скільки сторінок входить у базовий сайт?",
            answer: "Зазвичай головна, послуги, кейси, про компанію, контакти й правові сторінки. Обсяг узгоджуємо на брифі.",
          },
          {
            question: "Чи зможу я сам редагувати контент?",
            answer: "Так, робимо керовані блоки, щоб ви могли оновлювати тексти без розробника.",
          },
          {
            question: "Чи оптимізуєте сайт під Google?",
            answer: "Так, закладаємо технічну SEO-базу. Просування контентом і посиланнями — окремий етап, який теж беремо.",
          },
          {
            question: "Чи можна додати онлайн-оплату чи кабінет згодом?",
            answer: "Так, сайт можна розширити до сервісу з оплатою, ролями й особистим кабінетом.",
          },
        ],
        cta: "Обговорити сайт",
        related: ["landing", "mvp"],
        minPrice: packNumber(lang, "corporate-site"),
      },

      mvp: {
        slug: "mvp",
        name: "MVP та вебсервіси",
        metaTitle: "Розробка MVP під ключ для стартапу | AVIA Digital",
        metaDescription: `Створення MVP і вебсервісів: discovery, UX, frontend, backend, база, авторизація, запуск. Перевіряємо ідею реальним продуктом. Старт від ${price("mvp", false)}.`,
        h1: "Розробка MVP та вебсервісів під ключ",
        intro: `Збираємо MVP і вебсервіси, коли вже мало просто сторінки й потрібна реальна логіка: ролі, база даних, авторизація, робота продукту. Допомагаємо перевірити ідею працюючим продуктом, а не презентацією. Старт від ${price("mvp")}.`,
        when: {
          title: "Коли потрібен MVP",
          text: "Коли у вас є ідея продукту й треба перевірити її на реальних користувачах, залучити інвестиції або запустити першу робочу версію сервісу. MVP дає робочий продукт із ключовим функціоналом — без роздування бюджету на зайве.",
        },
        includes: {
          title: "Що входить",
          items: [
            "Discovery й карта ролей",
            "UX-сценарії та пріоритизація функціоналу",
            "Дизайн",
            "Frontend і backend",
            "База даних",
            "Авторизація",
            "Базова аналітика",
            "Реліз, handoff і план наступних ітерацій",
          ],
          note: "Будуємо так, щоб продукт можна було розвивати далі.",
        },
        process: {
          title: "Як проходить робота",
          text: "Починаємо з discovery й пріоритизації, щоб у перший реліз пішло головне. Далі — дизайн, збірка, інтеграції, тестування й запуск. Після релізу даємо чіткий план наступних кроків і залишаємось на підтримці.",
        },
        cost: {
          title: "Скільки коштує",
          text: `Старт від ${price("mvp")}. Ціна залежить від складності логіки, кількості ролей, інтеграцій і обсягу функціоналу. Точний scope і кошторис — після discovery.`,
        },
        faq: [
          {
            question: "Чим MVP відрізняється від повного продукту?",
            answer: "MVP містить лише ключовий функціонал для перевірки ідеї — щоб швидше й дешевше вийти на користувачів.",
          },
          {
            question: "Скільки часу займає розробка MVP?",
            answer: "Зазвичай 6–10 тижнів залежно від складності. Точні строки даємо після discovery.",
          },
          {
            question: "Чи зможемо масштабувати продукт після MVP?",
            answer: "Так, будуємо архітектуру з прицілом на розвиток — наступні функції додаються ітераціями.",
          },
          {
            question: "Чи робите AI-функції?",
            answer: "Так, додаємо AI там, де він реально скорочує ручну роботу або дає цінність продукту.",
          },
        ],
        cta: "Обговорити MVP",
        related: ["integrations", "corporate-site"],
        minPrice: packNumber(lang, "mvp"),
      },

      integrations: {
        slug: "integrations",
        name: "Інтеграції та автоматизація",
        metaTitle: "Інтеграції та автоматизація: CRM, платіжки, API | AVIA Digital",
        metaDescription:
          "Підключаємо сайт і сервіс до CRM, платіжних систем, email і API. Webhook-сценарії, автоматизація рутини, тестування й документація. Кошторис — після аудиту.",
        h1: "Інтеграції та автоматизація бізнес-процесів",
        intro:
          "Робимо так, щоб ваш сайт чи сервіс говорив з CRM, платіжкою, email і сторонніми API без ручної рутини. Аудит потоку даних, API-зв'язки, webhook-сценарії, автоматизація — з тестуванням і документацією.",
        when: {
          title: "Коли потрібні інтеграції",
          text: "Коли заявки доводиться переносити руками, дані губляться між системами, а процеси тримаються на ручній роботі. Інтеграції зв'язують інструменти в один потік: заявка з сайту сама летить у CRM, оплата підтверджується автоматично, клієнт отримує лист без вашої участі.",
        },
        includes: {
          title: "Що входить",
          items: [
            "Аудит поточного потоку даних і точок інтеграції",
            "Проєктування зв'язок",
            "API-інтеграції",
            "Webhook-сценарії та автоматизації",
            "Тестування й логування",
            "Коротка технічна документація — щоб усе було прозорим і підтримуваним",
          ],
        },
        process: {
          title: "Як проходить робота",
          text: "Спершу розбираємо, що й куди має передаватись, і де зараз рветься потік. Далі — реалізація зв'язок, тестування на реальних сценаріях і передача з документацією. Ви отримуєте робочу автоматизацію, а не «чорну скриньку».",
        },
        cost: {
          title: "Скільки коштує",
          text: "Ціна залежить від кількості систем, складності логіки й обсягу автоматизації. Точний кошторис — після аудиту потоку даних, до оплати.",
        },
        faq: [
          {
            question: "З якими системами ви інтегруєте?",
            answer: "З популярними CRM, платіжними системами, email-сервісами та будь-якими сервісами, що мають API.",
          },
          {
            question: "Чи можна автоматизувати обробку заявок?",
            answer: "Так. Налаштовуємо, щоб заявки потрапляли в CRM і запускали потрібні сценарії без ручної роботи.",
          },
          {
            question: "Що як у сервісу немає готового API?",
            answer: "Розглянемо альтернативи: webhook, проміжний сервіс або парсинг — підберемо робоче рішення під задачу.",
          },
          {
            question: "Чи залишиться документація?",
            answer: "Так, передаємо коротку технічну документацію по кожній інтеграції.",
          },
        ],
        cta: "Обговорити інтеграцію",
        related: ["mvp", "corporate-site"],
        minPrice: null,
      },
    };
  }

  return {
    landing: {
      slug: "landing",
      name: "Landing pages",
      metaTitle: "Turnkey landing page development in 2–3 weeks | AVIA Digital",
      metaDescription: `A landing page for a service, an ad campaign or a demand test: structure, sales copy, responsive layout, SEO basics and a lead form. From ${price("landing", false)}.`,
      h1: "Turnkey landing pages built to sell",
      intro: `We build landing pages you can put ads behind and start collecting leads from on day one. Not a pretty page for its own sake, but a clear structure built for conversion: the offer, the benefits, the proof, the form. Live in 2–3 weeks, starting from ${price("landing")}.`,
      when: {
        title: "When you need a landing page",
        text: "When you need to launch a new service or product fast, test demand before scaling, build a page for an ad campaign or pitch an offer to cold traffic. If the goal is to collect leads or validate an idea without a big budget, a landing page is the cheapest and fastest way to get there.",
      },
      includes: {
        title: "What's included",
        items: [
          "Prototype and a structure built for conversion",
          "Sales copy and the offer",
          "Responsive, mobile-first layout",
          "SEO basics: meta tags, speed, structured data",
          "Lead form wired into your channel of choice",
          "Analytics and domain setup",
        ],
        note: "If needed, we add a payment flow or online checkout right on the page.",
      },
      process: {
        title: "How we work",
        steps: [
          "Brief — we pin down the product, the goal, the audience and the deadline.",
          "Prototype — we agree on the block structure and the conversion logic.",
          "Design — we design around your brand and show it before any code.",
          "Build — responsive layout, performance, integrations.",
          "Launch — we connect the domain and analytics and hand over access.",
        ],
      },
      cost: {
        title: "What it costs",
        text: `From ${price("landing")}. The final price depends on the number of blocks, design complexity and integrations. You get an exact quote after the brief — always before payment, never "ask our manager".`,
      },
      faq: [
        {
          question: "How long does a landing page take?",
          answer: "Usually 2–3 weeks from brief to launch, depending on scope and how quickly feedback comes back.",
        },
        {
          question: "Do you write the copy?",
          answer: "Yes, we write sales copy around your offer. All we need from you is the input about the product.",
        },
        {
          question: "Can it grow into a full website later?",
          answer: "Yes. A landing page can be extended into a company website or a web service without switching contractors.",
        },
        {
          question: "What do you need from me to start?",
          answer: "A short brief: what the product is, who the customer is and what the page should achieve. We handle the rest.",
        },
      ],
      cta: "Discuss a landing page",
      related: ["mvp", "integrations"],
      minPrice: packNumber(lang, "landing"),
    },

    "corporate-site": {
      slug: "corporate-site",
      name: "Company websites",
      metaTitle: "Turnkey company website development | AVIA Digital",
      metaDescription: `A company website with services, case studies, FAQ, contacts and SEO — built to earn trust and ready for traffic and leads. From ${price("corporate-site", false)}.`,
      h1: "Company websites that earn trust",
      intro: `We build websites that sell your company: a clear presentation of your services, case studies, answers to your clients' questions and a proper entry point for leads. Not a template "business card", but a site you can manage yourself, ready for ads and SEO. From ${price("corporate-site")}.`,
      when: {
        title: "When you need a company website",
        text: "When one landing page is no longer enough: you need to show the full range of services, gather case studies and proof, answer clients' questions and look like a serious business rather than a temporary page. It's the foundation for trust, traffic and repeat business.",
      },
      includes: {
        title: "What's included",
        items: [
          "Sitemap and a structure shaped around your business",
          "Design in your brand",
          "Editable content blocks",
          "Service and case study pages",
          "An \"About us\" section",
          "Contacts and legal pages",
          "SEO basics and readiness for traffic, leads and online payments",
        ],
      },
      process: {
        title: "How we work",
        text: "From the brief and the sitemap, through design and build, to launch and handover. You see the work in progress at every stage — no surprises at the end.",
      },
      cost: {
        title: "What it costs",
        text: `From ${price("corporate-site")}. The price depends on the number of pages, design complexity, content blocks and integrations. Exact quote after the brief, before payment.`,
      },
      faq: [
        {
          question: "How many pages does a basic website include?",
          answer: "Usually a home page, services, case studies, about us, contacts and legal pages. We agree on the scope at the brief.",
        },
        {
          question: "Will I be able to edit the content myself?",
          answer: "Yes, we build editable blocks so you can update the copy without a developer.",
        },
        {
          question: "Do you optimise the site for Google?",
          answer: "Yes, we lay down the technical SEO foundation. Content and link building are a separate stage, which we also take on.",
        },
        {
          question: "Can online payments or a client portal be added later?",
          answer: "Yes, the website can grow into a service with payments, roles and a personal account.",
        },
      ],
      cta: "Discuss a website",
      related: ["landing", "mvp"],
      minPrice: packNumber(lang, "corporate-site"),
    },

    mvp: {
      slug: "mvp",
      name: "MVPs and web services",
      metaTitle: "Turnkey MVP development for startups | AVIA Digital",
      metaDescription: `MVPs and web services: discovery, UX, frontend, backend, database, authentication and launch. We test your idea with a real product. From ${price("mvp", false)}.`,
      h1: "Turnkey MVP and web service development",
      intro: `We build MVPs and web services once a page is no longer enough and you need real logic: roles, a database, authentication, a working product. We help you test the idea with a product that works, not a pitch deck. From ${price("mvp")}.`,
      when: {
        title: "When you need an MVP",
        text: "When you have a product idea and need to test it on real users, raise investment or launch the first working version of a service. An MVP gives you a working product with the core features — without inflating the budget on extras.",
      },
      includes: {
        title: "What's included",
        items: [
          "Discovery and a role map",
          "UX flows and feature prioritisation",
          "Design",
          "Frontend and backend",
          "Database",
          "Authentication",
          "Basic analytics",
          "Release, handoff and a plan for the next iterations",
        ],
        note: "We build it so the product can keep growing.",
      },
      process: {
        title: "How we work",
        text: "We start with discovery and prioritisation so that the first release contains what matters most. Then design, build, integrations, testing and launch. After release you get a clear plan for the next steps, and we stay on for support.",
      },
      cost: {
        title: "What it costs",
        text: `From ${price("mvp")}. The price depends on the complexity of the logic, the number of roles, integrations and the scope of features. Exact scope and quote after discovery.`,
      },
      faq: [
        {
          question: "How is an MVP different from a full product?",
          answer: "An MVP contains only the core features needed to test the idea — so you reach users faster and for less.",
        },
        {
          question: "How long does MVP development take?",
          answer: "Usually 6–10 weeks depending on complexity. We give exact timelines after discovery.",
        },
        {
          question: "Can the product scale after the MVP?",
          answer: "Yes, we design the architecture with growth in mind — new features are added in iterations.",
        },
        {
          question: "Do you build AI features?",
          answer: "Yes, we add AI where it genuinely cuts manual work or adds value to the product.",
        },
      ],
      cta: "Discuss an MVP",
      related: ["integrations", "corporate-site"],
      minPrice: packNumber(lang, "mvp"),
    },

    integrations: {
      slug: "integrations",
      name: "Integrations and automation",
      metaTitle: "Integrations and automation: CRM, payments, APIs | AVIA Digital",
      metaDescription:
        "We connect your site or service to CRMs, payment systems, email and APIs: webhook flows, automated routine, testing and docs. Quote after an audit.",
      h1: "Business process integrations and automation",
      intro:
        "We make your website or service talk to your CRM, payment provider, email and third-party APIs — with no manual routine. A data-flow audit, API connections, webhook flows and automation, all tested and documented.",
      when: {
        title: "When you need integrations",
        text: "When leads have to be copied over by hand, data gets lost between systems and processes depend on manual work. Integrations tie your tools into a single flow: a lead from the website lands in the CRM on its own, payments are confirmed automatically and the client gets an email without you lifting a finger.",
      },
      includes: {
        title: "What's included",
        items: [
          "An audit of the current data flow and integration points",
          "Designing the connections",
          "API integrations",
          "Webhook flows and automations",
          "Testing and logging",
          "Concise technical documentation — so everything stays transparent and maintainable",
        ],
      },
      process: {
        title: "How we work",
        text: "First we work out what needs to go where, and where the flow currently breaks. Then we build the connections, test them on real scenarios and hand them over with documentation. You get working automation, not a black box.",
      },
      cost: {
        title: "What it costs",
        text: "The price depends on the number of systems, the complexity of the logic and the scope of automation. Exact quote after the data-flow audit, before payment.",
      },
      faq: [
        {
          question: "Which systems do you integrate with?",
          answer: "Popular CRMs, payment systems, email services and any service that has an API.",
        },
        {
          question: "Can lead processing be automated?",
          answer: "Yes. We set it up so leads land in your CRM and trigger the right flows without any manual work.",
        },
        {
          question: "What if a service has no ready-made API?",
          answer: "We look at the alternatives — webhooks, a middleware service or scraping — and pick a solution that works for the task.",
        },
        {
          question: "Will there be documentation?",
          answer: "Yes, we hand over concise technical documentation for every integration.",
        },
      ],
      cta: "Discuss an integration",
      related: ["mvp", "corporate-site"],
      minPrice: null,
    },
  };
}

const CACHE: Partial<Record<Lang, Record<ServiceSlug, ServiceContent>>> = {};

export function getServices(lang: Lang) {
  return (CACHE[lang] ??= build(lang));
}

export function getService(lang: Lang, slug: ServiceSlug) {
  return getServices(lang)[slug];
}

export function isServiceSlug(value: string): value is ServiceSlug {
  return (SERVICE_SLUGS as readonly string[]).includes(value);
}

/** Тексти сторінки-хабу й спільних блоків. */
export const SERVICES_HUB = {
  ua: {
    name: "Послуги",
    metaTitle: "Послуги: лендінги, сайти, MVP та інтеграції | AVIA Digital",
    metaDescription:
      "Лендінги, сайти компаній, MVP і вебсервіси, інтеграції та автоматизація: що входить, як працюємо, з чого починається ціна. Кошторис погоджуємо до оплати.",
    eyebrow: "Послуги",
    all: "Усі послуги",
    title: "Що ми робимо",
    sub: "Чотири напрямки, з яких зазвичай починається робота. Магазини, мобільні застосунки й кастомне ПЗ — у тарифах на головній.",
    more: "Детальніше",
    related: "Суміжні послуги",
    faqTitle: "Часті питання",
    fares: "Усі тарифи",
  },
  en: {
    name: "Services",
    metaTitle: "Our services: websites, MVPs and integrations | AVIA Digital",
    metaDescription:
      "Landing pages, company websites, MVPs, web services, integrations and automation: what's included, how we work and where pricing starts. Quote before payment.",
    eyebrow: "Services",
    all: "All services",
    title: "What we do",
    sub: "Four areas where most projects begin. Online stores, mobile apps and custom software are listed in the pricing on the home page.",
    more: "Learn more",
    related: "Related services",
    faqTitle: "FAQ",
    fares: "All pricing",
  },
} as const;
