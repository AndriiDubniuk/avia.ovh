export type Lang = "ua" | "en";

export const LANGS: Lang[] = ["ua", "en"];

export type Dict = {
  htmlLang: string;
  /** Локаль для Intl — дати й суми мають читатись мовою інтерфейсу. */
  locale: string;

  nav: {
    services: string;
    cases: string;
    prices: string;
    process: string;
    contact: string;
    offer: string;
    privacy: string;
    billing: string;
    mySubs: string;
    menu: string;
    close: string;
    sections: string;
    pages: string;
    crumb: string;
    footBrand: string;
  };

  consent: { before: string; offer: string; middle: string; privacy: string; after: string };

  /** Спільні підписи, що повторюються на кількох екранах. */
  common: {
    dash: string;
    refresh: string;
    amount: string;
    interval: string;
    nextCharge: string;
    cancelledAt: string;
    status: string;
    currency: string;
    provider: string;
    email: string;
    name: string;
    company: string;
    namePlaceholder: string;
    optional: string;
    toPayment: string;
    preparingPayment: string;
    mySubs: string;
    toCheckout: string;
    cancelAuto: string;
    cancelling: string;
  };

  home: {
    crumb: string;
    eyebrow: string;
    title: string[];
    sub: string;
    clr: string[];
    chips: string[];
    plansTitle: string[];
    plansLoadingTag: string;
    plansTag: (count: number) => string;
    plansLoading: string;
    formTag: string;
    formTitle: string;
    formBody: string;
    chosen: string;
    errPlans: string;
    errPage: string;
    errPick: string;
    errCheckout: string;
    errCheckoutFallback: string;
  };

  privateMode: {
    crumb: string;
    title: string;
    sub: string;
    requestLink: string;
    noteBefore: string;
    noteLink: string;
    noteAfter: string;
  };

  portal: {
    crumb: string;
    eyebrow: string;
    title: string;
    sub: string;
    sentTag: string;
    sentTitle: string;
    sentAlert: string;
    sentBody: string;
    loginTag: string;
    loginTitle: string;
    loginBody: string;
    submit: string;
    submitting: string;
    checks: string[];
    method: string;
    methodValue: string;
    passwords: string;
    passwordsValue: string;
    hintBefore: string;
    hintStrong: string;
    hintAfter: string;
    errSend: string;
    errSendRetry: string;
  };

  verify: {
    crumb: string;
    eyebrow: string;
    checking: string;
    incomplete: string;
    expired: string;
    ready: string;
    failedGeneric: string;
    headingLoading: string[];
    headingSuccess: string[];
    headingFailed: string[];
    labelLoading: string;
    labelSuccess: string;
    labelFailed: string;
    newLink: string;
  };

  subs: {
    crumb: string;
    eyebrow: string;
    title: string;
    sub: string;
    otherEmail: string;
    active: string;
    total: string;
    loading: string;
    empty: string;
    card: string;
    open: string;
    errLoad: string;
    errLoadRetry: string;
  };

  personal: {
    crumb: string;
    eyebrow: string;
    title: string;
    sub: string;
    linkActive: string;
    loading: string;
    plan: string;
    validUntil: string;
    token: string;
    confirmTag: string;
    confirmTitle: string;
    confirmBody: string;
    noteBefore: string;
    noteStrong: string;
    noteAfter: string;
    errOffer: string;
    errOpen: string;
    errPay: string;
    errCheckout: string;
  };

  status: {
    crumb: string;
    eyebrow: string;
    title: string;
    currentTag: string;
    loadingPlan: string;
    loadingHint: string;
    detailsTag: string;
    monoStatus: string;
    start: string;
    end: string;
    actionsTag: string;
    paid: string;
    failed: string;
    cancelHint: string;
    refresh: string;
    refreshing: string;
    cancelPayment: string;
    manage: string;
    cancelled: string;
    lifecycleTitle: string[];
    lifecycleTag: string;
    lifecycle: { ph: string; title: string; text: string }[];
    errStatus: string;
    errNotFound: string;
    errIncomplete: string;
    errNetwork: string;
    errCancel: string;
  };

  manage: {
    crumb: string;
    eyebrow: string;
    title: string;
    sub: string;
    idTag: string;
    loading: string;
    stateTag: string;
    historyTag: string;
    paidCount: (n: number) => string;
    failedCount: (n: number) => string;
    retryCount: (n: number) => string;
    retries: string;
    historyLoading: string;
    noPaid: string;
    noFailed: string;
    historyUnavailable: string;
    created: string;
    finalized: string;
    payNow: string;
    payOpening: string;
    checkoutExpired: string;
    cancelledMsg: string;
    aboutTag: string;
    aboutTitle: string;
    aboutBody: string;
    aboutChecks: string[];
    topLinkPortal: string;
    topLinkPublic: string;
    errLoad: string;
    errHistory: string;
    errCancel: string;
    errCancelRetry: string;
    errPay: string;
  };

  result: {
    crumb: string;
    badge: string;
    title: string[];
    sub: string;
    clr: string[];
    startPayment: string;
    noteBefore: string;
    noteStrong: string;
    noteAfter: string;
  };

  /** Пояснення станів підписки на екрані результату. */
  states: Record<
    | "active"
    | "past_due"
    | "suspended"
    | "cancelled"
    | "failed"
    | "expired"
    | "awaiting_payment"
    | "unknown",
    { description: string; ctaLabel: string }
  >;
};

const ua: Dict = {
  htmlLang: "uk",
  locale: "uk-UA",

  nav: {
    services: "Послуги",
    cases: "Кейси",
    prices: "Ціни",
    process: "Процес",
    contact: "Обговорити проєкт",
    offer: "Публічна оферта",
    privacy: "Політика конфіденційності",
    billing: "Billing",
    mySubs: "Мої підписки",
    menu: "Меню",
    close: "Закрити",
    sections: "Розділи",
    pages: "Сторінки",
    crumb: "Хлібні крихти",
    footBrand: "AVIA DIGITAL · ЦИФРОВІ ПОСЛУГИ ДИСТАНЦІЙНО",
  },

  /**
   * Кнопка оплати ініціює токенізацію картки й регулярні списання, тому
   * згода прямо називає автопродовження — вимога прозорості до операцій
   * з ініціативи отримувача (MIT) з боку еквайра та платіжних систем.
   */
  consent: {
    before: "Натискаючи кнопку, ви підтверджуєте згоду з ",
    offer: "публічною офертою",
    middle: " та ",
    privacy: "політикою конфіденційності",
    after:
      ", а для тарифів з автопродовженням — згоду на збереження платіжного токена картки та автоматичне списання за кожен наступний період до скасування підписки. Скасувати можна будь-коли до наступного списання.",
  },

  common: {
    dash: "—",
    refresh: "Оновити",
    amount: "Сума",
    interval: "Періодичність",
    nextCharge: "Наступне списання",
    cancelledAt: "Скасовано",
    status: "Статус",
    currency: "Валюта",
    provider: "Провайдер",
    email: "Email",
    name: "Імʼя",
    company: "Компанія",
    namePlaceholder: "Наприклад, Андрій",
    optional: "Необов'язково",
    toPayment: "Перейти до оплати →",
    preparingPayment: "Готуємо оплату...",
    mySubs: "Мої підписки",
    toCheckout: "На сторінку оплати",
    cancelAuto: "Скасувати автопродовження",
    cancelling: "Скасовуємо...",
  },

  home: {
    crumb: "Checkout",
    eyebrow: "Перед стартом",
    title: ["Оформлення", "підписки."],
    sub: "Оберіть тариф, оплатіть через monobank і отримайте доступ одразу після першого платежу.",
    clr: [
      "PAYMENT SCENARIO —",
      "проста оплата, автоматичне продовження.",
      "Вибір → Оплата → monobank → Доступ.",
    ],
    chips: [
      "Картка, Apple Pay або Google Pay",
      "Автоматичне продовження через monobank",
      "Скасування в один клік, без звернення в підтримку",
    ],
    plansTitle: ["Доступні", "тарифи."],
    plansLoadingTag: "завантаження",
    plansTag: (count) => `${count} плани · UAH`,
    plansLoading: "Завантажуємо тарифи...",
    formTag: "Оформлення",
    formTitle: "Ваші дані",
    formBody:
      "У monobank ви підтвердите перший платіж. Після цього побачите статус, дату наступного списання й кнопку скасування автопродовження.",
    chosen: "Обрано",
    errPlans: "Не вдалося завантажити тарифи. Оновіть сторінку.",
    errPage: "Не вдалося завантажити сторінку оплати. Оновіть її.",
    errPick: "Оберіть тариф, перш ніж переходити до оплати.",
    errCheckout: "Не вдалося відкрити оплату. Спробуйте ще раз за хвилину.",
    errCheckoutFallback: "Не вдалося перейти до оплати. Гроші не списано.",
  },

  privateMode: {
    crumb: "Оплата за посиланням",
    title: "Оплата зараз — тільки за персональним посиланням.",
    sub: "Відкрийте посилання, яке ви отримали від нас: тариф і сума в ньому вже зафіксовані.",
    requestLink: "Запросити посилання",
    noteBefore: "Немає персонального посилання? ",
    noteLink: "Напишіть через форму на avia.ovh",
    noteAfter: " — надішлемо нове з фіксованим тарифом і сумою.",
  },

  portal: {
    crumb: "Portal",
    eyebrow: "Підтвердження особи",
    title: "Мої підписки.",
    sub: "Введіть email, з якого оплачували. Надішлемо на нього посилання для входу — пароль не потрібен.",
    sentTag: "Надіслано",
    sentTitle: "Перевірте пошту.",
    sentAlert: "Якщо на цю адресу є підписки, лист уже надіслано.",
    sentBody:
      "Відкрийте його і перейдіть за посиланням. Якщо листа немає — перевірте спам.",
    loginTag: "Вхід",
    loginTitle: "Без пароля. Тільки пошта.",
    loginBody:
      "Ми не зберігаємо паролі. Доступ підтверджується одноразовим посиланням, що приходить на вашу пошту.",
    submit: "Надіслати посилання для входу",
    submitting: "Надсилаємо...",
    checks: [
      "Посилання одноразове й діє обмежений час.",
      "Ми не підтверджуємо, чи існує email — відповідь однакова в обох випадках.",
      "Доступ дає лише перегляд і керування власними підписками.",
    ],
    method: "Метод",
    methodValue: "одноразове посилання",
    passwords: "Паролі",
    passwordsValue: "не зберігаються",
    hintBefore: "Лист не прийшов? Перевірте спам або ",
    hintStrong: "спробуйте інший email",
    hintAfter: ", з якого була оплата.",
    errSend: "Не вдалося надіслати лист. Спробуйте ще раз за хвилину.",
    errSendRetry: "Не вдалося надіслати лист. Спробуйте ще раз.",
  },

  verify: {
    crumb: "Перевірка",
    eyebrow: "Вхід у кабінет",
    checking: "Перевіряємо посилання. Кілька секунд.",
    incomplete: "Посилання неповне. Схоже, адреса скопіювалась не повністю.",
    expired: "Посилання вже недійсне — вони одноразові й діють обмежений час.",
    ready: "Готово. Відкриваємо ваші підписки...",
    failedGeneric: "Не вдалося перевірити посилання. Запросіть нове.",
    headingLoading: ["Перевіряємо", "посилання..."],
    headingSuccess: ["Готово."],
    headingFailed: ["Посилання", "не спрацювало."],
    labelLoading: "Перевіряємо",
    labelSuccess: "Доступ підтверджено",
    labelFailed: "Помилка доступу",
    newLink: "Надіслати нове посилання →",
  },

  subs: {
    crumb: "Мої підписки",
    eyebrow: "Ваш журнал",
    title: "Мої підписки.",
    sub: "Усе, що оформлено на цю пошту: статус, сума, дата наступного списання й перехід у керування.",
    otherEmail: "Увійти з іншої пошти",
    active: "Активних",
    total: "Усього",
    loading: "Завантажуємо підписки...",
    empty: "На цю адресу підписок немає. Можливо, оплата була з іншої пошти.",
    card: "Підписка",
    open: "Відкрити →",
    errLoad: "Не вдалося завантажити підписки. Спробуйте оновити.",
    errLoadRetry: "Не вдалося завантажити підписки. Спробуйте ще раз.",
  },

  personal: {
    crumb: "Персональна оплата",
    eyebrow: "Персональний доступ",
    title: "Персональна оплата.",
    sub: "Посилання з фіксованою пропозицією: тариф і сума вже погоджені й не зміняться.",
    linkActive: "Посилання активне",
    loading: "Відкриваємо пропозицію...",
    plan: "Тариф",
    validUntil: "Діє до",
    token: "Token",
    confirmTag: "Підтвердження",
    confirmTitle: "Перевірте дані — і запускаємось.",
    confirmBody:
      "Імʼя та email підтягнулись із пропозиції. Змініть, якщо оплачує інша людина.",
    noteBefore:
      "Посилання одноразове й прив'язане до конкретної пропозиції. Якщо термін дії сплив — ",
    noteStrong: "зверніться за новим",
    noteAfter: ".",
    errOffer: "Посилання не знайдено або вже не діє. Попросіть у нас нове.",
    errOpen: "Не вдалося відкрити пропозицію. Спробуйте ще раз.",
    errPay: "Не вдалося відкрити оплату. Спробуйте ще раз.",
    errCheckout: "Не вдалося перейти до оплати. Гроші не списано.",
  },

  status: {
    crumb: "Статус підписки",
    eyebrow: "Телеметрія після запуску",
    title: "Статус підписки.",
    currentTag: "Поточний стан",
    loadingPlan: "Завантажуємо дані...",
    loadingHint:
      "Завантажуємо дані. Якщо нічого не з'явилось — натисніть «Оновити статус».",
    detailsTag: "Деталі",
    monoStatus: "Статус у monobank",
    start: "Початок",
    end: "Завершення",
    actionsTag: "Дії",
    paid: "Успішні списання",
    failed: "Невдалі списання",
    cancelHint:
      "Автопродовження можна скасувати тут — поки підписка активна або чекає першого платежу.",
    refresh: "Оновити статус",
    refreshing: "Оновлюємо...",
    cancelPayment: "Скасувати оплату",
    manage: "Керувати підпискою",
    cancelled: "Автопродовження скасовано. Нових списань не буде.",
    lifecycleTitle: ["Що станеться", "далі."],
    lifecycleTag: "Lifecycle",
    lifecycle: [
      {
        ph: "Checkout",
        title: "Оплата",
        text: "Перший платіж підтверджується у monobank, картка запам'ятовується.",
      },
      {
        ph: "Active",
        title: "Доступ",
        text: "Підписка активна, дата наступного списання зафіксована.",
      },
      {
        ph: "Renewal",
        title: "Продовження",
        text: "Автосписання за розкладом. Невдала спроба переводить у past_due.",
      },
      {
        ph: "Cancel",
        title: "Зупинка",
        text: "Скасування автопродовження в один клік. Нових списань не буде.",
      },
    ],
    errStatus: "Не вдалося отримати статус. Спробуйте оновити сторінку.",
    errNotFound: "Оплату не знайдено. Перевірте посилання або почніть заново.",
    errIncomplete:
      "Посилання неповне. Відкрийте його повністю з листа або повідомлення.",
    errNetwork: "Немає зв'язку із сервером. Перевірте інтернет і спробуйте ще раз.",
    errCancel: "Не вдалося скасувати автопродовження. Спробуйте ще раз.",
  },

  manage: {
    crumb: "Керування підпискою",
    eyebrow: "Керування",
    title: "Керування підпискою.",
    sub: "Стан, суми, історія списань і одна кнопка, щоб зупинити автопродовження. Без листування з підтримкою.",
    idTag: "Номер підписки",
    loading: "Завантажуємо підписку...",
    stateTag: "Поточний стан",
    historyTag: "Історія списань",
    paidCount: (n) => `Успішних списань: ${n}`,
    failedCount: (n) => `Невдалих списань: ${n}`,
    retryCount: (n) => `Повторних спроб: ${n}`,
    retries: "Повторних спроб",
    historyLoading: "Завантажуємо історію...",
    noPaid: "Списань ще не було.",
    noFailed: "Невдалих спроб не було.",
    historyUnavailable: "Історія списань поки недоступна. Спробуйте оновити.",
    created: "Створено",
    finalized: "Завершено",
    payNow: "Сплатити зараз →",
    payOpening: "Відкриваємо оплату...",
    checkoutExpired:
      "Час на оплату вийшов. Напишіть нам — надішлемо нове посилання з тією ж сумою.",
    cancelledMsg:
      "Автопродовження скасовано. Підписка діє до кінця оплаченого періоду.",
    aboutTag: "Про скасування",
    aboutTitle: "Скасування зупиняє списання, а не доступ.",
    aboutBody:
      "Після скасування підписка діє до кінця оплаченого періоду. Далі доступ закривається, нових списань немає.",
    aboutChecks: [
      "Скасувати можна будь-коли до дати наступного списання.",
      "Оформити знову — через оплату або персональне посилання.",
      "Історія платежів лишається доступною в кабінеті.",
    ],
    topLinkPortal: "Мої підписки",
    topLinkPublic: "Оформити ще одну",
    errLoad: "Не вдалося завантажити підписку. Спробуйте оновити сторінку.",
    errHistory: "Не вдалося завантажити історію. Спробуйте оновити.",
    errCancel: "Не вдалося скасувати автопродовження. Спробуйте ще раз.",
    errCancelRetry: "Не вдалося скасувати. Спробуйте ще раз або напишіть нам.",
    errPay: "Не вдалося відкрити оплату. Спробуйте ще раз.",
  },

  result: {
    crumb: "Оплата",
    badge: "Ідентифікатор не переданий",
    title: ["Посилання", "неповне."],
    sub: "У посиланні бракує ідентифікатора оплати (checkoutId). Найчастіше так буває, коли адресу скопіювали не повністю — відкрийте її з листа ще раз.",
    clr: [
      "NAVIGATION ERROR —",
      "маршрут існує, координати втрачено.",
      "Почніть оплату заново або відкрийте портал підписок.",
    ],
    startPayment: "Почати оплату →",
    noteBefore: "Отримали посилання на оплату від нас? ",
    noteStrong: "Відкрийте його повністю",
    noteAfter: " — ідентифікатор передається у параметрі запиту.",
  },

  states: {
    active: {
      description:
        "Підписка активна. Наступне списання пройде автоматично у вказану дату.",
      ctaLabel: "Оформити ще одну",
    },
    past_due: {
      description:
        "Чергове списання не пройшло. Спробуємо ще раз — або оформіть оплату заново з іншою карткою.",
      ctaLabel: "Оплатити заново",
    },
    suspended: {
      description:
        "Підписку призупинено після кількох невдалих списань. Щоб відновити доступ, оформіть оплату заново.",
      ctaLabel: "Відновити доступ",
    },
    cancelled: {
      description:
        "Автопродовження вимкнено, нових списань не буде. Підписка діє до кінця оплаченого періоду.",
      ctaLabel: "Оформити знову",
    },
    failed: {
      description: "Перший платіж не пройшов, гроші не списано. Можна спробувати ще раз.",
      ctaLabel: "Спробувати ще раз",
    },
    expired: {
      description: "Час на оплату вийшов. Почніть оплату заново — сума не зміниться.",
      ctaLabel: "Почати заново",
    },
    awaiting_payment: {
      description:
        "Чекаємо підтвердження платежу від monobank. Сторінка оновиться сама.",
      ctaLabel: "Оновити статус",
    },
    unknown: {
      description: "Уточнюємо статус у платіжного сервісу. Це займе кілька секунд.",
      ctaLabel: "Оновити статус",
    },
  },
};

const en: Dict = {
  htmlLang: "en",
  locale: "en-GB",

  nav: {
    services: "Services",
    cases: "Cases",
    prices: "Pricing",
    process: "Process",
    contact: "Start a project",
    offer: "Public offer",
    privacy: "Privacy policy",
    billing: "Billing",
    mySubs: "My subscriptions",
    menu: "Menu",
    close: "Close",
    sections: "Sections",
    pages: "Pages",
    crumb: "Breadcrumbs",
    footBrand: "AVIA DIGITAL · DIGITAL SERVICES, REMOTELY",
  },

  consent: {
    before: "By pressing the button you agree to the ",
    offer: "public offer",
    middle: " and the ",
    privacy: "privacy policy",
    after:
      ", and for auto-renewing plans — to the card payment token being stored and to an automatic charge for each subsequent period until the subscription is cancelled. You can cancel any time before the next charge.",
  },

  common: {
    dash: "—",
    refresh: "Refresh",
    amount: "Amount",
    interval: "Interval",
    nextCharge: "Next charge",
    cancelledAt: "Cancelled",
    status: "Status",
    currency: "Currency",
    provider: "Provider",
    email: "Email",
    name: "Name",
    company: "Company",
    namePlaceholder: "For example, Andrii",
    optional: "Optional",
    toPayment: "Go to payment →",
    preparingPayment: "Preparing payment...",
    mySubs: "My subscriptions",
    toCheckout: "Back to checkout",
    cancelAuto: "Cancel auto-renewal",
    cancelling: "Cancelling...",
  },

  home: {
    crumb: "Checkout",
    eyebrow: "Before you start",
    title: ["Subscription", "checkout."],
    sub: "Pick a plan, pay via monobank and get access right after the first payment.",
    clr: [
      "PAYMENT SCENARIO —",
      "simple payment, automatic renewal.",
      "Choice → Payment → monobank → Access.",
    ],
    chips: [
      "Card, Apple Pay or Google Pay",
      "Automatic renewal via monobank",
      "One-click cancellation, no support tickets",
    ],
    plansTitle: ["Available", "plans."],
    plansLoadingTag: "loading",
    plansTag: (count) => `${count} plans · UAH`,
    plansLoading: "Loading plans...",
    formTag: "Checkout",
    formTitle: "Your details",
    formBody:
      "You confirm the first payment in monobank. After that you will see the status, the next charge date and the button to cancel auto-renewal.",
    chosen: "Selected",
    errPlans: "Could not load the plans. Please refresh the page.",
    errPage: "Could not load the checkout page. Please refresh it.",
    errPick: "Choose a plan before going to payment.",
    errCheckout: "Could not open the payment. Please try again in a minute.",
    errCheckoutFallback: "Could not proceed to payment. No money was charged.",
  },

  privateMode: {
    crumb: "Payment by link",
    title: "Payment is currently available by personal link only.",
    sub: "Open the link you received from us: the plan and the amount are already fixed there.",
    requestLink: "Request a link",
    noteBefore: "No personal link? ",
    noteLink: "Write to us through the form on avia.ovh",
    noteAfter: " — we will send a new one with a fixed plan and amount.",
  },

  portal: {
    crumb: "Portal",
    eyebrow: "Identity check",
    title: "My subscriptions.",
    sub: "Enter the email you paid from. We will send a sign-in link to it — no password needed.",
    sentTag: "Sent",
    sentTitle: "Check your inbox.",
    sentAlert: "If this address has subscriptions, the email has already been sent.",
    sentBody:
      "Open it and follow the link. If there is no email — check the spam folder.",
    loginTag: "Sign in",
    loginTitle: "No password. Email only.",
    loginBody:
      "We do not store passwords. Access is confirmed by a one-time link sent to your inbox.",
    submit: "Send the sign-in link",
    submitting: "Sending...",
    checks: [
      "The link is one-time and valid for a limited period.",
      "We do not confirm whether an email exists — the answer is the same either way.",
      "Access only allows viewing and managing your own subscriptions.",
    ],
    method: "Method",
    methodValue: "one-time link",
    passwords: "Passwords",
    passwordsValue: "not stored",
    hintBefore: "No email? Check the spam folder or ",
    hintStrong: "try another email",
    hintAfter: " — the one the payment was made from.",
    errSend: "Could not send the email. Please try again in a minute.",
    errSendRetry: "Could not send the email. Please try again.",
  },

  verify: {
    crumb: "Verification",
    eyebrow: "Signing in",
    checking: "Checking the link. A few seconds.",
    incomplete: "The link is incomplete. It looks like the address was not copied fully.",
    expired: "The link is no longer valid — links are one-time and expire.",
    ready: "Done. Opening your subscriptions...",
    failedGeneric: "Could not verify the link. Please request a new one.",
    headingLoading: ["Checking", "the link..."],
    headingSuccess: ["Done."],
    headingFailed: ["The link", "did not work."],
    labelLoading: "Checking",
    labelSuccess: "Access confirmed",
    labelFailed: "Access error",
    newLink: "Send a new link →",
  },

  subs: {
    crumb: "My subscriptions",
    eyebrow: "Your log",
    title: "My subscriptions.",
    sub: "Everything registered to this email: status, amount, next charge date and a way into management.",
    otherEmail: "Sign in with another email",
    active: "Active",
    total: "Total",
    loading: "Loading subscriptions...",
    empty: "There are no subscriptions for this address. The payment may have used another email.",
    card: "Subscription",
    open: "Open →",
    errLoad: "Could not load the subscriptions. Try refreshing.",
    errLoadRetry: "Could not load the subscriptions. Please try again.",
  },

  personal: {
    crumb: "Personal payment",
    eyebrow: "Personal access",
    title: "Personal payment.",
    sub: "A link with a fixed offer: the plan and the amount are already agreed and will not change.",
    linkActive: "Link is active",
    loading: "Opening the offer...",
    plan: "Plan",
    validUntil: "Valid until",
    token: "Token",
    confirmTag: "Confirmation",
    confirmTitle: "Check the details — and we launch.",
    confirmBody:
      "The name and email came from the offer. Change them if someone else is paying.",
    noteBefore:
      "The link is one-time and bound to a specific offer. If it has expired — ",
    noteStrong: "ask us for a new one",
    noteAfter: ".",
    errOffer: "The link was not found or is no longer valid. Ask us for a new one.",
    errOpen: "Could not open the offer. Please try again.",
    errPay: "Could not open the payment. Please try again.",
    errCheckout: "Could not proceed to payment. No money was charged.",
  },

  status: {
    crumb: "Subscription status",
    eyebrow: "Telemetry after launch",
    title: "Subscription status.",
    currentTag: "Current state",
    loadingPlan: "Loading data...",
    loadingHint:
      "Loading data. If nothing appeared — press “Refresh status”.",
    detailsTag: "Details",
    monoStatus: "Status in monobank",
    start: "Start",
    end: "End",
    actionsTag: "Actions",
    paid: "Successful charges",
    failed: "Failed charges",
    cancelHint:
      "Auto-renewal can be cancelled here — while the subscription is active or awaiting the first payment.",
    refresh: "Refresh status",
    refreshing: "Refreshing...",
    cancelPayment: "Cancel the payment",
    manage: "Manage subscription",
    cancelled: "Auto-renewal cancelled. There will be no new charges.",
    lifecycleTitle: ["What happens", "next."],
    lifecycleTag: "Lifecycle",
    lifecycle: [
      {
        ph: "Checkout",
        title: "Payment",
        text: "The first payment is confirmed in monobank, the card is remembered.",
      },
      {
        ph: "Active",
        title: "Access",
        text: "The subscription is active, the next charge date is fixed.",
      },
      {
        ph: "Renewal",
        title: "Renewal",
        text: "Automatic charge on schedule. A failed attempt moves it to past_due.",
      },
      {
        ph: "Cancel",
        title: "Stop",
        text: "One-click cancellation of auto-renewal. No new charges.",
      },
    ],
    errStatus: "Could not get the status. Try refreshing the page.",
    errNotFound: "The payment was not found. Check the link or start again.",
    errIncomplete: "The link is incomplete. Open it fully from the email or message.",
    errNetwork: "No connection to the server. Check the internet and try again.",
    errCancel: "Could not cancel auto-renewal. Please try again.",
  },

  manage: {
    crumb: "Subscription management",
    eyebrow: "Management",
    title: "Subscription management.",
    sub: "State, amounts, charge history and one button to stop auto-renewal. No support correspondence.",
    idTag: "Subscription number",
    loading: "Loading the subscription...",
    stateTag: "Current state",
    historyTag: "Charge history",
    paidCount: (n) => `Successful charges: ${n}`,
    failedCount: (n) => `Failed charges: ${n}`,
    retryCount: (n) => `Retries: ${n}`,
    retries: "Retries",
    historyLoading: "Loading history...",
    noPaid: "There have been no charges yet.",
    noFailed: "There have been no failed attempts.",
    historyUnavailable: "Charge history is not available yet. Try refreshing.",
    created: "Created",
    finalized: "Finalized",
    payNow: "Pay now →",
    payOpening: "Opening the payment...",
    checkoutExpired:
      "The payment window has closed. Write to us — we will send a new link with the same amount.",
    cancelledMsg:
      "Auto-renewal cancelled. The subscription runs until the end of the paid period.",
    aboutTag: "About cancellation",
    aboutTitle: "Cancelling stops the charges, not the access.",
    aboutBody:
      "After cancellation the subscription runs until the end of the paid period. Then access closes and there are no new charges.",
    aboutChecks: [
      "You can cancel any time before the next charge date.",
      "To subscribe again — through checkout or a personal link.",
      "The payment history stays available in the portal.",
    ],
    topLinkPortal: "My subscriptions",
    topLinkPublic: "Subscribe again",
    errLoad: "Could not load the subscription. Try refreshing the page.",
    errHistory: "Could not load the history. Try refreshing.",
    errCancel: "Could not cancel auto-renewal. Please try again.",
    errCancelRetry: "Could not cancel. Please try again or write to us.",
    errPay: "Could not open the payment. Please try again.",
  },

  result: {
    crumb: "Payment",
    badge: "Identifier not provided",
    title: ["The link", "is incomplete."],
    sub: "The link is missing the payment identifier (checkoutId). This usually happens when the address was not copied fully — open it from the email again.",
    clr: [
      "NAVIGATION ERROR —",
      "the route exists, the coordinates are lost.",
      "Start the payment again or open the subscriptions portal.",
    ],
    startPayment: "Start the payment →",
    noteBefore: "Received a payment link from us? ",
    noteStrong: "Open it in full",
    noteAfter: " — the identifier is passed in the query parameter.",
  },

  states: {
    active: {
      description:
        "The subscription is active. The next charge will happen automatically on the stated date.",
      ctaLabel: "Subscribe again",
    },
    past_due: {
      description:
        "The scheduled charge did not go through. We will retry — or complete the payment again with another card.",
      ctaLabel: "Pay again",
    },
    suspended: {
      description:
        "The subscription was suspended after several failed charges. To restore access, complete the payment again.",
      ctaLabel: "Restore access",
    },
    cancelled: {
      description:
        "Auto-renewal is off, there will be no new charges. The subscription runs until the end of the paid period.",
      ctaLabel: "Subscribe again",
    },
    failed: {
      description:
        "The first payment did not go through, no money was charged. You can try again.",
      ctaLabel: "Try again",
    },
    expired: {
      description:
        "The payment window has closed. Start the payment again — the amount will not change.",
      ctaLabel: "Start again",
    },
    awaiting_payment: {
      description:
        "Waiting for monobank to confirm the payment. The page will refresh itself.",
      ctaLabel: "Refresh status",
    },
    unknown: {
      description: "Checking the status with the payment service. It takes a few seconds.",
      ctaLabel: "Refresh status",
    },
  },
};

export const DICT: Record<Lang, Dict> = { ua, en };
