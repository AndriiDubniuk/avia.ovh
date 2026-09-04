import { legalEntity } from "@/lib/legal-entity";
import {
  offerEn,
  offerUa,
  privacyEn,
  privacyUa,
  type LegalDict,
  type PrivacyDict,
} from "@/lib/legal-content";

export type Lang = "ua" | "en";

export const LANGS: Lang[] = ["ua", "en"];

/**
 * Позиції вузлів схеми у відсотках контейнера. У центрі — цифровий продукт,
 * навколо дев'ять напрямків через кожні 40° (радіус 38% по X, 40% по Y).
 */
export const NODE_POSITIONS = [
  { x: 50, y: 50, core: true },
  { x: 50, y: 10, core: false },
  { x: 74, y: 19, core: false },
  { x: 87, y: 43, core: false },
  { x: 83, y: 70, core: false },
  { x: 63, y: 88, core: false },
  { x: 37, y: 88, core: false },
  { x: 17, y: 70, core: false },
  { x: 13, y: 43, core: false },
  { x: 26, y: 19, core: false },
] as const;

type Dict = {
  htmlLang: string;
  backHome: string;

  nav: {
    avionics: string;
    log: string;
    fares: string;
    plan: string;
    book: string;
    menu: string;
    close: string;
    sections: string;
    pages: string;
    skip: string;
  };

  homeFooter: {
    /** Опис студії. Не рендериться — використовується як description у Schema.org. */
    lead: string;
    navTitle: string;
    legalTitle: string;
    contact: string;
    offer: string;
    privacy: string;
    billing: string;
    rights: string;
  };

  hero: { eyebrow: string; title: string[]; sub: string; cue: string };

  notFound: {
    metaTitle: string;
    eyebrow: string;
    title: string[];
    sub: string;
    links: string;
    cta: string;
    ghost: string;
  };
  rotate: { eyebrow: string; title: string[]; clr: string[] };
  manifesto: { text: string; accent: string }[];

  avionics: {
    eyebrow: string;
    title: string[];
    defaultRead: string;
    nodes: { name: string; read: string }[];
  };

  log: {
    eyebrow: string;
    title: string[];
    legs: { no: string; dest: string; cat: string; val: string }[];
  };

  plan: {
    eyebrow: string;
    title: string[];
    steps: {
      phase: string;
      title: string;
      description: string;
      /** Підетапи стадії — саме вони «вилітають» картками з активної фази. */
      items: { title: string; text: string }[];
    }[];
  };

  fares: {
    eyebrow: string;
    title: string[];
    packs: { title: string; price: string; timeline: string; summary: string }[];
    note: string;
  };

  departure: {
    eyebrow: string;
    title: string[];
    markets: string[];
    record: string;
    cta: string;
    ghost: string;
  };

  contactPage: {
    crumb: string;
    eyebrow: string;
    title: string[];
    sub: string;
    afterTag: string;
    afterTitle: string[];
    /** Етапи співпраці — продають процес, а не просто описують його. */
    after: { no: string; title: string; text: string }[];
    afterNote: string;
    facts: { label: string; value: string }[];
    termsEyebrow: string;
    termsTitle: string[];
    termsTag: string;
    /** Пояснення «людською», а не переказ норм: заголовок + суть. */
    terms: { title: string; text: string }[];
    offer: string;
    privacy: string;
    billing: string;
    faqEyebrow: string;
    faqTitle: string[];
    faqTag: string;
    faq: { question: string; answer: string }[];
  };

  form: {
    tag: string;
    title: string;
    lead: string;
    fields: {
      name: { label: string; placeholder: string; error: string };
      company: { label: string; placeholder: string; error: string };
      email: { label: string; placeholder: string; error: string };
      /**
       * Канал зв'язку обирається зі списку з пошуком, а формат самого
       * контакту залежить від обраного каналу — тому в API йде вже
       * зібраний рядок «Канал: значення».
       */
      contact: {
        label: string;
        methodLabel: string;
        methodPlaceholder: string;
        searchPlaceholder: string;
        noResults: string;
        methodError: string;
        error: string;
        methods: { id: string; label: string; placeholder: string }[];
      };
      service: { label: string; error: string };
      message: { label: string; placeholder: string; error: string };
    };
    serviceDefault: string;
    consent: { before: string; offer: string; middle: string; privacy: string; after: string };
    submit: string;
    submitting: string;
    success: string;
    errorRequest: string;
    errorGeneric: string;
  };

  footer: { brand: string; offer: string; privacy: string; billing: string; contact: string };

  /** Тексти юридичних документів живуть у `legal-content.ts`. */
  offer: LegalDict;
  privacy: PrivacyDict;
};

const ua: Dict = {
  htmlLang: "uk",
  backHome: "На головну",

  nav: {
    avionics: "Послуги",
    log: "Кейси",
    fares: "Ціни",
    plan: "Процес",
    book: "Запустити проєкт",
    menu: "Меню",
    close: "Закрити",
    sections: "Розділи",
    pages: "Сторінки",
    skip: "До контенту",
  },

  homeFooter: {
    lead: "AVIA Digital — студія цифрових продуктів: сайти, застосунки, MVP, кастомне ПЗ, брендинг, SEO та реклама. Працюємо дистанційно, стартові ціни публічні.",
    navTitle: "Розділи",
    legalTitle: "Документи",
    contact: "Обговорити проєкт",
    offer: "Публічна оферта",
    privacy: "Політика конфіденційності",
    billing: "Billing",
    rights: "AVIA DIGITAL · ЦИФРОВІ ПОСЛУГИ ДИСТАНЦІЙНО",
  },

  notFound: {
    metaTitle: "Сторінку не знайдено",
    eyebrow: "Відхилення від курсу · 404",
    title: ["Цієї сторінки", "не існує."],
    sub: "Схоже, адреса змінилась або в ній одрук. Нижче — координати, за якими точно щось є.",
    links: "Куди далі",
    cta: "На головну →",
    ghost: "Обговорити проєкт",
  },

  hero: {
    eyebrow: "Курс на запуск",
    title: ["Одна команда —", "від ідеї до готового продукту."],
    sub: "Сайти, застосунки, кастомні системи, AI та digital-маркетинг. Беремо задачу цілком: від стратегії й дизайну до розробки, запуску та зростання.",
    cue: "ГОРТАЙТЕ, ЩОБ ЗЛЕТІТИ",
  },

  rotate: {
    eyebrow: "Набір висоти",
    title: ["Ми піднімаємо", "продукти вгору."],
    clr: [
      "КУРС НА ЗАПУСК —",
      "від ідеї на землі до продукту в повітрі.",
      "Стратегія → Дизайн → Розробка → Зростання, в одному безперервному наборі висоти.",
    ],
  },

  manifesto: [
    { text: "Земля — це там, де ідеї ", accent: "чекають." },
    { text: "Ми не прикрашаємо екрани.", accent: "" },
    { text: "Ми конструюємо ", accent: "висоту." },
  ],

  avionics: {
    eyebrow: "Панель зростання",
    title: ["Дев'ять напрямків.", "Один продукт у центрі."],
    defaultRead: "Наведіть на напрямок — побачите, як він працює на продукт.",
    nodes: [
      {
        name: "Цифровий продукт",
        read: "Центр системи — усе інше існує, щоб продукт працював і зростав.",
      },
      { name: "Веброзробка", read: "Каркас — швидкий, стійкий, готовий до масштабу." },
      { name: "Мобільні застосунки", read: "Другий екран — нативне охоплення iOS та Android." },
      { name: "Кастомне ПЗ", read: "Двигун — власна логіка, що керує бізнесом." },
      { name: "AI-інтеграції", read: "Інтелект — рішення, що масштабуються без штату." },
      { name: "SEO", read: "Навігація — вас знаходять на кожному важливому маршруті." },
      { name: "Google Ads", read: "Імпульс A — намір, схоплений на висоті." },
      { name: "Meta Ads", read: "Імпульс B — попит там, де живе увага." },
      { name: "Брендинг", read: "Розпізнавальні знаки — ідентичність, яку памʼятають з першого погляду." },
      { name: "Продуктовий дизайн", read: "Панель керування — як продукт відчувається в руці." },
    ],
  },

  log: {
    eyebrow: "Журнал місій · Орбіта",
    title: ["Кожен кейс —", "це нова висота."],
    legs: [
      { no: "01", dest: "MONIBEX", cat: "Фінтех · управління фінансами", val: "продукт і бренд" },
      {
        no: "02",
        dest: "WANDER BOUTIQUE",
        cat: "Крафтовий шоколад · Київ, Житомир",
        val: "онлайн-магазин",
      },
      {
        no: "03",
        dest: "SNS GRILLS УКРАЇНА",
        cat: "Грилі та BBQ · офіційний дистриб'ютор",
        val: "каталог і продажі",
      },
      {
        no: "04",
        dest: "GRADOIL",
        cat: "Переробка соняшнику й ріпаку · Кропивницький",
        val: "корпоративний сайт",
      },
    ],
  },

  plan: {
    eyebrow: "Траєкторія проєкту",
    title: ["Чотири фази.", "Без турбулентності."],
    steps: [
      {
        phase: "Підготовка",
        title: "Бриф",
        description: "Фіксуємо ціль, дедлайни й інтеграції — без розмитого «під ключ».",
        items: [
          {
            title: "Дискавері-сесія",
            text: "Розбираємо задачу, аудиторію й обмеження. Ви говорите — ми ставимо незручні питання.",
          },
          {
            title: "Аналіз ринку",
            text: "Дивимось, що вже працює у конкурентів, а що ні. Не копіюємо — обходимо.",
          },
          {
            title: "Технічні вимоги",
            text: "Інтеграції, навантаження, безпека, дані. Усе, що потім не має стати сюрпризом.",
          },
          {
            title: "Кошторис і план",
            text: "Фіксована сума, строки й перелік робіт на папері. До будь-якої оплати.",
          },
        ],
      },
      {
        phase: "Зліт",
        title: "Дизайн",
        description: "Стратегія, продуктовий дизайн та ідентичність, що привертають увагу.",
        items: [
          {
            title: "Структура та сценарії",
            text: "Що бачить користувач, у якому порядку і до якої дії ми його ведемо.",
          },
          {
            title: "Адаптивні стани",
            text: "Як екран поводиться на телефоні, планшеті й десктопі — разом із порожніми станами, завантаженням і помилками.",
          },
          {
            title: "Візуальна мова",
            text: "Типографіка, колір, сітка, стан елементів. Не декор, а система рішень.",
          },
          {
            title: "Дизайн-система",
            text: "Компоненти, які масштабуються: нова сторінка не потребує нового дизайну.",
          },
        ],
      },
      {
        phase: "Набір",
        title: "Розробка",
        description: "Frontend, backend, мобайл і AI — справжня логіка продукту.",
        items: [
          {
            title: "Frontend",
            text: "Інтерфейс, швидкість, доступність. Працює на телефоні так само, як на десктопі.",
          },
          {
            title: "Backend і дані",
            text: "Логіка, ролі, права доступу, база. Те, що тримає продукт під навантаженням.",
          },
          {
            title: "Інтеграції",
            text: "Оплати, CRM, склад, аналітика, AI. Продукт живе всередині вашого процесу.",
          },
          {
            title: "Тестування й реліз",
            text: "QA, навантаження, передача коду, доступів і документації. Без «загубленого» доступу.",
          },
        ],
      },
      {
        phase: "Політ",
        title: "Зростання",
        description: "SEO, Google та Meta Ads та ітерації, що тримають висоту.",
        items: [
          {
            title: "SEO",
            text: "Технічна база, семантика, контент. Трафік, за який не треба платити щодня.",
          },
          {
            title: "Google та Meta Ads",
            text: "Намір і попит: одні шукають вас самі, інших знаходимо ми.",
          },
          {
            title: "Аналітика",
            text: "Видно, який канал приносить гроші, а який просто витрачає бюджет.",
          },
          {
            title: "Ітерації",
            text: "Щомісячні покращення за даними, а не за смаком. Працюємо, поки це вигідно вам.",
          },
        ],
      },
    ],
  },

  fares: {
    eyebrow: "Стартові ціни",
    title: ["Публічні ціни.", "Узгоджені до старту."],
    packs: [
      {
        title: "Лендінг",
        price: "від ₴22,500",
        timeline: "2–3 тижні",
        summary: "Структура, тексти, CTA, форма, SEO-база.",
      },
      {
        title: "Сайт компанії",
        price: "від ₴120,000",
        timeline: "3–5 тижнів",
        summary: "Сторінки, кейси, FAQ, SEO, контент.",
      },
      {
        title: "Інтернет-магазин",
        price: "від ₴200,000",
        timeline: "5–8 тижнів",
        summary: "Каталог, кошик, оплата, доставка, аналітика.",
      },
      {
        title: "MVP",
        price: "від ₴280,000",
        timeline: "6–10 тижнів",
        summary: "Дискавері, ролі, база, авторизація, реліз.",
      },
      {
        title: "Мобільний застосунок",
        price: "від ₴300,000",
        timeline: "за скоупом",
        summary: "Нативні iOS та Android, один продукт.",
      },
      {
        title: "Кастомне ПЗ",
        price: "від ₴350,000",
        timeline: "за скоупом",
        summary: "Власна логіка, інтеграції, масштаб.",
      },
    ],
    note: "Стартові ціни — фінальний скоуп, бюджет і терміни узгоджуємо до будь-якої оплати. Також беремо: SaaS-платформи, кабінети клієнтів, AI-продукти, автоматизації, технічні аудити, продуктову стратегію та підтримку.",
  },

  departure: {
    eyebrow: "Наступний крок",
    title: ["Куди вести", "ваш продукт?"],
    markets: ["УКРАЇНА", "ЄВРОПА", "ВЕЛИКА БРИТАНІЯ", "США"],
    record: "ЧІТКИЙ СКОУП · ПУБЛІЧНІ ЦІНИ · SENIOR-КОМАНДА — без невизначеності до старту.",
    cta: "Запустити проєкт →",
    ghost: "Дивитися кейси",
  },

  contactPage: {
    crumb: "Обговорити проєкт",
    eyebrow: "Контакт",
    title: ["Опишіть задачу", "в кількох рядках."],
    sub: "Повернемось з оцінкою, етапами та бюджетом. Без дзвінків, поки ви самі про них не попросите.",
    afterTag: "Маршрут співпраці",
    afterTitle: ["Чотири етапи", "від заявки до зростання."],
    after: [
      {
        no: "01",
        title: "Дослідження",
        text: "Розбираємо задачу, ринок і конкурентів. На виході — карта рішення: що робимо, чого свідомо не робимо і чому саме так. Це найдешевший етап, на якому ще можна змінити все.",
      },
      {
        no: "02",
        title: "Комерційна пропозиція",
        text: "Фіксований обсяг, строки й ціна на папері. Не «від», не «залежить» — конкретна сума за конкретний результат. Ви вирішуєте, маючи всі цифри на руках.",
      },
      {
        no: "03",
        title: "Розробка та запуск",
        text: "Збираємо продукт спринтами з демо наприкінці кожного. Ви бачите прогрес щотижня, а не через два місяці мовчання. Реліз — з передачею коду, доступів і документації.",
      },
      {
        no: "04",
        title: "Зростання",
        text: "Продукт у повітрі — далі набираємо висоту: SEO, реклама, аналітика, ітерації за даними. Працюємо далі, лише якщо вам це вигідно.",
      },
    ],
    afterNote:
      "Перші два етапи ні до чого вас не зобов'язують: ви отримуєте карту рішення й точну ціну — і тільки потім вирішуєте, летимо чи ні.",
    /**
     * Блок реквізитів — виконання ст. 7 ЗУ «Про електронну комерцію»
     * № 675-VIII (доступ до відомостей про виконавця) і ч. 2 ст. 13 ЗУ
     * «Про захист прав споживачів» № 1023-XII (найменування, адреса,
     * порядок прийняття претензії до укладення договору на відстані).
     */
    facts: [
      { label: "Виконавець", value: legalEntity.legalName },
      { label: "Адреса", value: legalEntity.address },
      { label: "Пошта", value: legalEntity.contactEmail },
      { label: "Робочі години", value: legalEntity.workingHours },
    ],
    termsEyebrow: "Перед оплатою",
    termsTitle: ["Що відомо", "до платежу."],
    termsTag: "Before you pay",
    terms: [
      {
        title: "Ціна не зміниться після того, як ви натиснете «оплатити»",
        text: "Ціни на сайті — стартові орієнтири. Точну суму ми називаємо до платежу, і саме вона стоїть на сторінці оплати. Усі ціни у гривні та остаточні: жодних податків, комісій чи доплат зверху не буде.",
      },
      {
        title: "Ви платите за послугу, а не за товар",
        text: "Результат цифровий — сайт, застосунок, інтеграція, код. Нічого не їде поштою, тому й витрат на доставку немає. Це впливає і на правила повернення: діють норми про послуги, а не про обмін товару.",
      },
      {
        title: "Дані вашої картки ми не бачимо",
        text: "Оплата проходить на захищеній сторінці monobank. Приймаємо Visa, Mastercard, Apple Pay і Google Pay. Номер картки, строк дії та CVV залишаються на боці банку — до нас вони не потрапляють навіть у зашифрованому вигляді.",
      },
      {
        title: "Підписка спишеться тільки тоді, коли ви на це погодились",
        text: "Автопродовження вмикається окремою дією на сторінці оплати, а не «за замовчуванням». Скасувати можна будь-коли до наступного списання — у кабінеті або листом. Період, який уже оплачено, ми дообслуговуємо до кінця.",
      },
      {
        title: "У вас є 14 днів, щоб передумати",
        text: "Якщо ви фізична особа й замовляєте не для бізнесу, договір можна розірвати протягом 14 днів. Єдиний виняток: якщо ви попросили почати роботу раніше і її вже виконано — тоді право на відмову втрачається. Ми завжди попереджаємо про це до старту.",
      },
      {
        title: "Гроші повертаємо на ту саму картку",
        text: "До 10 банківських днів. Робота не почалася — повертаємо все. Почалася — за вирахуванням фактично виконаного, і ми надсилаємо письмовий розрахунок, щоб ви бачили, за що саме утримано.",
      },
      {
        title: "Якщо щось піде не так — є куди звернутися",
        text: `Претензію надсилайте на ${legalEntity.contactEmail}, відповідаємо протягом 14 днів. Крім нас, ви можете звернутися до Держпродспоживслужби, щодо персональних даних — до Уповноваженого ВРУ з прав людини, або оскаржити операцію напряму у своєму банку.`,
      },
      {
        title: "Усі документи відкриті ще до оплати",
        text: "Реквізити виконавця, публічна оферта й політика конфіденційності опубліковані окремими сторінками. Нічого не ховається за реєстрацією і не з'являється «потім».",
      },
    ],
    offer: "Публічна оферта",
    privacy: "Політика конфіденційності",
    billing: "Billing для підписок",
    faqEyebrow: "Питання",
    faqTitle: ["Що питають", "найчастіше."],
    faqTag: "04 питання",
    faq: [
      {
        question: "Що саме можна замовити?",
        answer:
          "Лендінг, сайт компанії, MVP, мобільний застосунок, кастомне ПЗ, інтеграції та автоматизацію. Якщо ваша задача не збігається з жодним пунктом — опишіть її. Скажемо прямо, беремось чи ні.",
      },
      {
        question: "Чому ціни вказані як «від»?",
        answer:
          "Бо фінальна вартість залежить від обсягу, логіки, дизайну, інтеграцій і строків. Стартова ціна показує нижню межу, щоб ви розуміли порядок сум ще до звернення.",
      },
      {
        question: "Коли і як відбувається оплата?",
        answer:
          "Спершу погоджуємо обсяг робіт і вартість конкретного етапу. Тільки після цього — онлайн-оплата. Без погодження нічого не списується.",
      },
      {
        question: "Це послуга чи товар?",
        answer:
          "Послуга. Цифрова, дистанційна, без фізичної доставки. Тому норми про повернення товару належної якості тут не діють — натомість працює право на розірвання договору, укладеного на відстані.",
      },
      {
        question: "Чи можна повернути кошти?",
        answer:
          "Так. Якщо робота ще не почалася — повертаємо повну суму. Якщо почалася — за вирахуванням фактично виконаної частини та підтверджених витрат, з письмовим розрахунком. Помилкові й задвоєні платежі повертаємо повністю. Строк повернення — до 10 банківських днів на ту саму картку. Деталі — у статті 13 оферти.",
      },
      {
        question: "Скільки часу є на відмову від договору?",
        answer:
          "Якщо ви фізична особа й замовляєте не для бізнесу, ви маєте 14 днів на розірвання договору, укладеного на відстані (ст. 13 Закону «Про захист прав споживачів»). Виняток: якщо ви попросили почати роботу раніше і її вже виконано — право на розірвання в цій частині втрачається, про що ми попереджаємо до старту.",
      },
      {
        question: "Як працює підписка й автосписання?",
        answer:
          "Автопродовження вмикається лише за вашою окремою згодою на сторінці оплати. Картку зберігає банк-еквайр у вигляді токена — ми не бачимо ні номера, ні CVV. Скасувати автопродовження можна будь-коли до наступного списання в кабінеті billing.avia.ovh/portal або листом на " +
          legalEntity.contactEmail +
          ". Оплачений період при цьому дообслуговується до кінця.",
      },
      {
        question: "Куди звертатися з претензією?",
        answer:
          "Письмово на " +
          legalEntity.contactEmail +
          " — вкажіть дату й суму платежу, ідентифікатор замовлення або підписки й суть вимоги. Відповідаємо протягом 14 календарних днів. Ви також маєте право звернутися до Держпродспоживслужби, а щодо персональних даних — до Уповноваженого ВРУ з прав людини, або оскаржити операцію через свій банк.",
      },
    ],
  },

  form: {
    tag: "Заявка",
    title: "Розкажіть про задачу",
    lead: "Кількох рядків достатньо. Повернемось з оцінкою, етапами та бюджетом.",
    fields: {
      name: {
        label: "Ім'я",
        placeholder: "Наприклад, Андрій",
        error: "Вкажіть, як до вас звертатися.",
      },
      company: {
        label: "Компанія",
        placeholder: "Необов'язково",
        error: "Назва задовга — до 80 символів.",
      },
      email: {
        label: "Email",
        placeholder: "name@company.com",
        error: "Перевірте email — схоже, є одруківка.",
      },
      contact: {
        label: "Контакт",
        methodLabel: "Спосіб зв'язку",
        methodPlaceholder: "Оберіть канал",
        searchPlaceholder: "Пошук каналу…",
        noResults: "Нічого не знайшли. Оберіть «Інше».",
        methodError: "Оберіть, як з вами зв'язатися.",
        error: "Лишіть контакт, щоб ми могли відповісти.",
        methods: [
          { id: "telegram", label: "Telegram", placeholder: "@nickname" },
          { id: "phone", label: "Телефон", placeholder: "+380 XX XXX XX XX" },
          { id: "whatsapp", label: "WhatsApp", placeholder: "+380 XX XXX XX XX" },
          { id: "viber", label: "Viber", placeholder: "+380 XX XXX XX XX" },
          { id: "signal", label: "Signal", placeholder: "+380 XX XXX XX XX" },
          { id: "email", label: "Інший email", placeholder: "name@company.com" },
          { id: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/…" },
          { id: "discord", label: "Discord", placeholder: "username" },
          { id: "slack", label: "Slack Connect", placeholder: "робочий email" },
          { id: "teams", label: "Microsoft Teams", placeholder: "робочий email" },
          { id: "other", label: "Інше", placeholder: "як з вами зв'язатися" },
        ],
      },
      service: { label: "Що потрібно", error: "Напишіть, що саме потрібно." },
      message: {
        label: "Коротко про задачу",
        placeholder:
          "Наприклад: сайт компанії на 6 сторінок із формою заявки, орієнтовно до кінця травня",
        error: "Кілька речень про задачу — цього вистачить для першої оцінки.",
      },
    },
    serviceDefault: "Розробка цифрових продуктів",
    /**
     * Згода має бути інформованою та однозначною (ст. 2 і ст. 11 ЗУ
     * «Про захист персональних даних» № 2297-VI), тому прямо називаємо
     * і мету обробки, і можливість відкликання.
     */
    consent: {
      before:
        "Натискаючи кнопку, ви приймаєте умови договору та надаєте згоду на обробку зазначених вами персональних даних для розгляду заявки й відповіді на неї — відповідно до ",
      offer: "публічної оферти",
      middle: " та ",
      privacy: "політики конфіденційності",
      after: ". Згоду можна відкликати будь-коли, написавши на privacy@avia.ovh.",
    },
    submit: "Отримати оцінку",
    submitting: "Передаємо...",
    success: "Готово, задача у нас. Повернемось з оцінкою, етапами та деталями запуску.",
    errorRequest: "Не вдалося передати задачу. Спробуйте ще раз за хвилину.",
    errorGeneric: "Щось пішло не так під час відправки. Спробуйте ще раз.",
  },

  footer: {
    brand: "AVIA DIGITAL · Цифрові продукти дистанційно",
    offer: "Публічна оферта",
    privacy: "Політика конфіденційності",
    billing: "Billing",
    contact: "Запустити проєкт",
  },

  offer: offerUa,
  privacy: privacyUa,
};

const en: Dict = {
  htmlLang: "en",
  backHome: "Back home",

  nav: {
    avionics: "Services",
    log: "Work",
    fares: "Pricing",
    plan: "Process",
    book: "Launch a project",
    menu: "Menu",
    close: "Close",
    sections: "Sections",
    pages: "Pages",
    skip: "Skip to content",
  },

  homeFooter: {
    lead: "AVIA Digital is a digital product studio: websites, apps, MVPs, custom software, branding, SEO and ads. We work remotely and publish our starting prices.",
    navTitle: "Sections",
    legalTitle: "Documents",
    contact: "Start a project",
    offer: "Public offer",
    privacy: "Privacy policy",
    billing: "Billing",
    rights: "AVIA DIGITAL · DIGITAL SERVICES, DELIVERED REMOTELY",
  },

  notFound: {
    metaTitle: "Page not found",
    eyebrow: "Off course · 404",
    title: ["This page", "does not exist."],
    sub: "The address has probably changed, or there is a typo in it. Below are the coordinates that definitely lead somewhere.",
    links: "Where to next",
    cta: "Back home →",
    ghost: "Start a project",
  },

  hero: {
    eyebrow: "On course to launch",
    title: ["One team —", "from idea to finished product."],
    sub: "Websites, apps, custom systems, AI and digital marketing. We take the whole task: from strategy and design through build, launch and growth.",
    cue: "SCROLL TO TAKE OFF",
  },

  rotate: {
    eyebrow: "Climb",
    title: ["We give", "products lift."],
    clr: [
      "SET FOR LAUNCH —",
      "from an idea on the ground to a product in the air.",
      "Strategy → Design → Build → Growth, in one continuous climb.",
    ],
  },

  manifesto: [
    { text: "Ground is where ideas ", accent: "wait." },
    { text: "We don't decorate screens.", accent: "" },
    { text: "We engineer ", accent: "altitude." },
  ],

  avionics: {
    eyebrow: "Growth panel",
    title: ["Nine disciplines.", "One product at the centre."],
    defaultRead: "Hover a discipline — see how it feeds the product.",
    nodes: [
      {
        name: "Digital product",
        read: "The centre of the system — everything else exists so the product works and grows.",
      },
      { name: "Web Development", read: "Frame — fast, resilient, built to scale." },
      { name: "Mobile Apps", read: "Second screen — native reach for iOS & Android." },
      { name: "Custom Software", read: "Powerplant — bespoke logic that runs the business." },
      { name: "AI Integrations", read: "Intelligence — decisions that scale without headcount." },
      { name: "SEO", read: "Navigation — found on every route that matters." },
      { name: "Google Ads", read: "Impulse A — intent captured at altitude." },
      { name: "Meta Ads", read: "Impulse B — demand built where attention lives." },
      { name: "Branding", read: "Markings — the identity people remember at first glance." },
      { name: "Product Design", read: "Controls — how the product feels in the hand." },
    ],
  },

  log: {
    eyebrow: "Mission log · Orbit",
    title: ["Every case", "is a new altitude."],
    legs: [
      { no: "01", dest: "MONIBEX", cat: "Fintech · personal finance", val: "product & brand" },
      {
        no: "02",
        dest: "WANDER BOUTIQUE",
        cat: "Craft chocolate · Kyiv, Zhytomyr",
        val: "online store",
      },
      {
        no: "03",
        dest: "SNS GRILLS UKRAINE",
        cat: "Grills & BBQ · official distributor",
        val: "catalogue & sales",
      },
      {
        no: "04",
        dest: "GRADOIL",
        cat: "Sunflower & rapeseed crushing · Kropyvnytskyi",
        val: "corporate website",
      },
    ],
  },

  plan: {
    eyebrow: "Project trajectory",
    title: ["Four phases.", "No turbulence."],
    steps: [
      {
        phase: "Setup",
        title: "Brief",
        description:
          "We capture the goal, deadlines and integrations — no vague “turnkey”.",
        items: [
          {
            title: "Discovery session",
            text: "We take apart the task, the audience and the constraints. You talk; we ask the awkward questions.",
          },
          {
            title: "Market analysis",
            text: "We look at what already works for competitors and what doesn't. We don't copy — we go around.",
          },
          {
            title: "Technical requirements",
            text: "Integrations, load, security, data. Everything that must not become a surprise later.",
          },
          {
            title: "Quote and plan",
            text: "A fixed figure, timeline and scope in writing. Before any payment.",
          },
        ],
      },
      {
        phase: "Takeoff",
        title: "Design",
        description: "Strategy, product design and identity that earn attention.",
        items: [
          {
            title: "Structure and flows",
            text: "What the user sees, in what order, and which action we are leading them to.",
          },
          {
            title: "Responsive states",
            text: "How each screen behaves on phone, tablet and desktop — including empty, loading and error states.",
          },
          {
            title: "Visual language",
            text: "Type, colour, grid, element states. Not decoration — a system of decisions.",
          },
          {
            title: "Design system",
            text: "Components that scale: a new page no longer needs a new design.",
          },
        ],
      },
      {
        phase: "Climb",
        title: "Build",
        description: "Frontend, backend, mobile and AI — real product logic, shipped.",
        items: [
          {
            title: "Frontend",
            text: "Interface, speed, accessibility. Works the same on a phone as on a desktop.",
          },
          {
            title: "Backend and data",
            text: "Logic, roles, permissions, database. What holds the product together under load.",
          },
          {
            title: "Integrations",
            text: "Payments, CRM, inventory, analytics, AI. The product lives inside your process.",
          },
          {
            title: "Testing and release",
            text: "QA, load, handover of code, access and documentation. Nothing gets lost.",
          },
        ],
      },
      {
        phase: "Cruise",
        title: "Growth",
        description:
          "SEO, Google & Meta Ads and iteration that keep you gaining altitude.",
        items: [
          {
            title: "SEO",
            text: "Technical base, semantics, content. Traffic you don't pay for every day.",
          },
          {
            title: "Google & Meta Ads",
            text: "Intent and demand: some people search for you, the rest we go and find.",
          },
          {
            title: "Analytics",
            text: "You can see which channel brings money and which just spends the budget.",
          },
          {
            title: "Iteration",
            text: "Monthly improvements driven by data, not taste. We keep going while it pays off.",
          },
        ],
      },
    ],
  },

  fares: {
    eyebrow: "Starting prices",
    title: ["Public prices.", "Agreed before we start."],
    packs: [
      {
        title: "Landing page",
        price: "from ₴22,500",
        timeline: "2–3 weeks",
        summary: "Structure, copy, CTA, lead form, SEO base.",
      },
      {
        title: "Company website",
        price: "from ₴120,000",
        timeline: "3–5 weeks",
        summary: "Pages, cases, FAQ, SEO, managed content.",
      },
      {
        title: "Online store",
        price: "from ₴200,000",
        timeline: "5–8 weeks",
        summary: "Catalogue, cart, payments, delivery, analytics.",
      },
      {
        title: "MVP",
        price: "from ₴280,000",
        timeline: "6–10 weeks",
        summary: "Discovery, roles, database, auth, release.",
      },
      {
        title: "Mobile app",
        price: "from ₴300,000",
        timeline: "scoped",
        summary: "Native iOS & Android, one product.",
      },
      {
        title: "Custom software",
        price: "from ₴350,000",
        timeline: "scoped",
        summary: "Bespoke logic, integrations, built to scale.",
      },
    ],
    note: "Starting prices — final scope, budget and timeline are agreed before any payment. We also take on: SaaS platforms, client portals, AI products, automations, technical audits, product strategy and ongoing support.",
  },

  departure: {
    eyebrow: "Next step",
    title: ["Where should", "your product go?"],
    markets: ["UKRAINE", "EUROPE", "UNITED KINGDOM", "UNITED STATES"],
    record:
      "CLEAR SCOPE · PUBLIC PRICES · SENIOR TEAM — no uncertainty before you commit.",
    cta: "Launch a project →",
    ghost: "See the work",
  },

  contactPage: {
    crumb: "Start a project",
    eyebrow: "Contact",
    title: ["Describe the task", "in a few lines."],
    sub: "We come back with an estimate, stages and a budget. No calls unless you ask for one.",
    afterTag: "The route",
    afterTitle: ["Four stages", "from request to growth."],
    after: [
      {
        no: "01",
        title: "Discovery",
        text: "We take apart the task, the market and the competitors. You get a map of the solution: what we build, what we deliberately don't, and why. It's the cheapest stage at which everything can still change.",
      },
      {
        no: "02",
        title: "The proposal",
        text: "Fixed scope, timeline and price, in writing. Not “from”, not “depends” — a specific figure for a specific result. You decide with every number in front of you.",
      },
      {
        no: "03",
        title: "Build and launch",
        text: "We ship in sprints, each ending in a demo. You see progress every week, not after two months of silence. Release comes with the code, the access and the documentation.",
      },
      {
        no: "04",
        title: "Growth",
        text: "The product is airborne — now we gain altitude: SEO, ads, analytics, iteration driven by data. We keep flying only while it pays off for you.",
      },
    ],
    afterNote:
      "The first two stages commit you to nothing: you walk away with a map of the solution and an exact price — and only then decide whether we fly.",
    facts: [
      { label: "Provider", value: legalEntity.legalNameEn },
      { label: "Address", value: legalEntity.addressEn },
      { label: "Email", value: legalEntity.contactEmail },
      { label: "Working hours", value: legalEntity.workingHoursEn },
    ],
    termsEyebrow: "Before you pay",
    termsTitle: ["What is known", "before payment."],
    termsTag: "Before you pay",
    terms: [
      {
        title: "The price won't change after you hit “pay”",
        text: "Prices on the site are starting reference points. We name the exact figure before payment, and that is what appears on the payment page. All prices are in UAH and final: no taxes, fees or surcharges get added on top.",
      },
      {
        title: "You are paying for a service, not a product",
        text: "The result is digital — a site, an app, an integration, code. Nothing ships by post, so there is no delivery cost. It also shapes the refund rules: the rules for services apply, not the ones for exchanging goods.",
      },
      {
        title: "We never see your card details",
        text: "Payment happens on monobank's secure page. We accept Visa, Mastercard, Apple Pay and Google Pay. The card number, expiry date and CVV stay on the bank's side — they never reach us, not even encrypted.",
      },
      {
        title: "A subscription charges only once you've agreed to it",
        text: "Auto-renewal is switched on by a separate action on the payment page, never by default. You can cancel any time before the next charge, in the portal or by email. The period already paid for is served to the end.",
      },
      {
        title: "You have 14 days to change your mind",
        text: "If you are a natural person ordering outside your business, you can withdraw from the contract within 14 days. One exception: if you asked us to start earlier and the work is done, the right is lost. We always warn you before starting.",
      },
      {
        title: "Refunds go back to the same card",
        text: "Within 10 banking days. If work hasn't started — everything comes back. If it has — less what was actually delivered, and we send a written calculation so you can see exactly what was withheld.",
      },
      {
        title: "If something goes wrong, there is somewhere to turn",
        text: `Send claims to ${legalEntity.contactEmail}; we reply within 14 days. Beyond us, you can contact the State Consumer Protection Service, the Ukrainian Parliament Commissioner for Human Rights on data matters, or dispute the transaction directly with your bank.`,
      },
      {
        title: "Every document is open before you pay",
        text: "The provider's details, the public offer and the privacy policy are published as separate pages. Nothing hides behind a signup or appears “later”.",
      },
    ],
    offer: "Public offer",
    privacy: "Privacy policy",
    billing: "Billing for subscriptions",
    faqEyebrow: "Questions",
    faqTitle: ["What people", "ask most."],
    faqTag: "04 questions",
    faq: [
      {
        question: "What exactly can I order?",
        answer:
          "A landing page, a company website, an MVP, a mobile app, custom software, integrations and automation. If your task doesn't match any of them — describe it and we'll say plainly whether we take it on.",
      },
      {
        question: "Why are prices shown as “from”?",
        answer:
          "Because the final price depends on scope, logic, design, integrations and timeline. The starting price shows the lower bound so you know the order of magnitude before getting in touch.",
      },
      {
        question: "When and how does payment happen?",
        answer:
          "First we agree the scope and price of a specific stage. Only then comes online payment. Nothing is charged without your approval.",
      },
      {
        question: "Is this a service or a product?",
        answer:
          "A service. Digital, delivered remotely, with no physical shipping. So the rules on returning goods of proper quality do not apply — the right to withdraw from a distance contract does.",
      },
      {
        question: "Can I get a refund?",
        answer:
          "Yes. If work has not started — a full refund. If it has — less the part actually delivered and documented costs, with a written calculation. Erroneous and duplicate charges are refunded in full. Refunds take up to 10 banking days back to the same card. Details are in Article 13 of the offer.",
      },
      {
        question: "How long do I have to withdraw?",
        answer:
          "If you are a natural person ordering outside your business, you have 14 days to withdraw from a distance contract (Article 13 of the Law on Consumer Protection). Exception: if you asked us to start earlier and the service has been delivered, the right of withdrawal is lost for that part — we warn you before starting.",
      },
      {
        question: "How do subscriptions and auto-renewal work?",
        answer:
          "Auto-renewal is enabled only with your separate consent on the payment page. The acquiring bank stores the card as a token — we never see the number or CVV. You can cancel any time before the next charge at billing.avia.ovh/portal or by writing to " +
          legalEntity.contactEmail +
          ". The period already paid for is served to the end.",
      },
      {
        question: "Where do I send a complaint?",
        answer:
          "In writing to " +
          legalEntity.contactEmail +
          " — state the date and amount of the payment, the order or subscription identifier and your demand. We reply within 14 calendar days. You may also contact the State Consumer Protection Service, the Ukrainian Parliament Commissioner for Human Rights on data matters, or dispute the transaction with your bank.",
      },
    ],
  },

  form: {
    tag: "Request",
    title: "Tell us about the task",
    lead: "A few lines are enough. We come back with an estimate, stages and a budget.",
    fields: {
      name: {
        label: "Name",
        placeholder: "For example, Andriy",
        error: "Tell us what to call you.",
      },
      company: {
        label: "Company",
        placeholder: "Optional",
        error: "The name is too long — up to 80 characters.",
      },
      email: {
        label: "Email",
        placeholder: "name@company.com",
        error: "Check the email — there seems to be a typo.",
      },
      contact: {
        label: "Contact",
        methodLabel: "How to reach you",
        methodPlaceholder: "Pick a channel",
        searchPlaceholder: "Search channels…",
        noResults: "Nothing found. Pick “Other”.",
        methodError: "Pick how we should reach you.",
        error: "Leave a contact so we can reply.",
        methods: [
          { id: "telegram", label: "Telegram", placeholder: "@nickname" },
          { id: "phone", label: "Phone", placeholder: "+380 XX XXX XX XX" },
          { id: "whatsapp", label: "WhatsApp", placeholder: "+380 XX XXX XX XX" },
          { id: "viber", label: "Viber", placeholder: "+380 XX XXX XX XX" },
          { id: "signal", label: "Signal", placeholder: "+380 XX XXX XX XX" },
          { id: "email", label: "Another email", placeholder: "name@company.com" },
          { id: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/…" },
          { id: "discord", label: "Discord", placeholder: "username" },
          { id: "slack", label: "Slack Connect", placeholder: "work email" },
          { id: "teams", label: "Microsoft Teams", placeholder: "work email" },
          { id: "other", label: "Other", placeholder: "how to reach you" },
        ],
      },
      service: { label: "What you need", error: "Write what exactly you need." },
      message: {
        label: "About the task",
        placeholder:
          "For example: a 6-page company website with a request form, roughly by the end of May",
        error: "A few sentences about the task — that's enough for a first estimate.",
      },
    },
    serviceDefault: "Digital product development",
    consent: {
      before:
        "By pressing the button you accept the terms of the contract and consent to the processing of the personal data you provide, so that we can review your request and reply to it — under the ",
      offer: "public offer",
      middle: " and the ",
      privacy: "privacy policy",
      after: ". You can withdraw consent at any time by writing to privacy@avia.ovh.",
    },
    submit: "Get an estimate",
    submitting: "Sending...",
    success:
      "Done, we have your task. We'll come back with an estimate, stages and launch details.",
    errorRequest: "Could not send the task. Try again in a minute.",
    errorGeneric: "Something went wrong while sending. Try again.",
  },

  footer: {
    brand: "AVIA DIGITAL · Digital products, delivered remotely",
    offer: "Public offer",
    privacy: "Privacy policy",
    billing: "Billing",
    contact: "Launch a project",
  },

  offer: offerEn,
  privacy: privacyEn,
};

export const DICT: Record<Lang, Dict> = { ua, en };
export type { Dict };
