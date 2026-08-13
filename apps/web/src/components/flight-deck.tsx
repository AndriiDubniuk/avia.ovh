"use client";

import { useEffect, useRef, type ReactNode } from "react";

export type Scene = {
  id: string;
  /** Початок вікна видимості сцени, 0..1 від висоти треку. */
  from: number;
  /** Кінець вікна видимості. */
  to: number;
  center?: boolean;
  content: ReactNode;
  /**
   * Необовʼязковий блок, прикріплений до низу вʼюпорта в межах сцени.
   * Живе поза `.content`, тому не бере участі в центруванні, але успадковує
   * прозорість сцени — так підвал зʼявляється рівно разом з нею й не додає
   * сторінці жодного пікселя прокрутки.
   */
  footer?: ReactNode;
};

/**
 * Ширина перехрестя між сусідніми сценами, у частках висоти треку.
 * Діапазони сцен у `home-view` перекриваються рівно на стільки ж, тому одна
 * згасає точно тоді, коли зʼявляється наступна.
 */
const CROSSFADE = 0.022;

/**
 * Довжина спаду прозорості, у частках треку.
 *
 * Вона навмисно вдвічі більша за перекриття сцен. Коли спад дорівнював
 * перекриттю, у точці перетину обидві сцени мали по 0.29 — і два тексти
 * читались один поверх одного. Довший спад означає, що кожна сцена підходить
 * до точки перетину вже майже згаслою (~0.16), а сам перехід стає довшим і
 * тому мʼякшим.
 */
const RAMP = CROSSFADE * 2.5;

/**
 * Хід сцени під час появи. Разом із довгим спадом він рознесе тексти по
 * вертикалі приблизно на 240px: навіть коли обидві сцени частково видимі,
 * вони не займають одне й те саме місце на екрані.
 */
const SLIDE = 140;

/**
 * Стеля швидкості зміни сцен, у частках треку за кадр.
 *
 * Коефіцієнта наздоганяння самого по собі мало: він задає частку від
 * відставання, тож чим різкіший кидок, тим швидше летять сцени. Різкий свайп
 * з інерцією проносив дві-три сцени за один жест. Ця стеля обмежує зміну
 * приблизно двома сценами за секунду незалежно від сили кидка. На повільне
 * гортання вона не впливає взагалі: там крок на порядок менший.
 */
const MAX_STEP = 0.004;

/**
 * Трапецієподібне вікно: 1 на всьому «плато» діапазону і спад завширшки
 * CROSSFADE на кожному краю.
 *
 * Раніше вікно було трикутним, а прозорість ще й обрізалась порогом. Через це
 * сцена сягала повної видимості лише біля самої середини свого діапазону, а між
 * діапазонами лишалися ділянки, де жодна сцена не мала прозорості більш ніж
 * нуль — приблизно чверть усієї прокрутки була порожнім небом.
 */
function band(x: number, a: number, b: number) {
  const t = Math.max(0, Math.min(1, (x - a) / RAMP, (b - x) / RAMP));
  // Згладжування, а не степінь: степінь тримав сцену біля нуля майже весь
  // спад і потім різко викидав її до одиниці — саме це читалось як різке
  // перемикання. Тут швидкість зміни плавно наростає й спадає.
  return t * t * (3 - 2 * t);
}

export function FlightDeck({ scenes }: { scenes: Scene[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const sceneRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let progress = 0;
    let target = 0;
    let raf = 0;

    function read() {
      if (!track) return;
      const scrollable = track.offsetHeight - window.innerHeight;
      // Верхня межа вища за 1, щоб остання сцена згасла, коли скрол іде далі —
      // у підвал під треком.
      target =
        scrollable > 0
          ? Math.min(1.4, Math.max(0, (window.scrollY - track.offsetTop) / scrollable))
          : 0;
    }

    /* Навігація по сценах: якорі в шапці ведуть на потрібну точку треку. */
    function onAnchorClick(event: MouseEvent) {
      const link = (event.target as HTMLElement | null)?.closest("a");
      const hash = link?.getAttribute("href");
      if (!hash || !hash.startsWith("#") || !track) return;

      const index = scenes.findIndex((scene) => `#${scene.id}` === hash);
      if (index < 0) return;

      event.preventDefault();
      const scene = scenes[index];
      const centre = (Math.max(0, scene.from) + scene.to) / 2;
      const scrollable = track.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: track.offsetTop + scrollable * centre,
        behavior: "smooth",
      });
    }

    document.addEventListener("click", onAnchorClick);

    /* Перехід із внутрішньої сторінки на "/#s-fares": після завантаження
       треба одразу опинитись на потрібній точці треку. */
    function jumpToHash() {
      const hash = window.location.hash;
      if (!hash || !track) return;
      const index = scenes.findIndex((scene) => `#${scene.id}` === hash);
      if (index < 0) return;
      const scene = scenes[index];
      const centre = (Math.max(0, scene.from) + scene.to) / 2;
      const scrollable = track.offsetHeight - window.innerHeight;
      // `instant` обовʼязково: на головній CSS задає `scroll-behavior: smooth`,
      // і без цього перехід за посиланням "/#s-fares" анімувався б від самого
      // верху сторінки замість того, щоб одразу опинитись на потрібній сцені.
      window.scrollTo({ top: track.offsetTop + scrollable * centre, behavior: "instant" });
      read();
      progress = target;
    }
    const jump = window.setTimeout(jumpToHash, 60);

    /* Пошук елементів маніфесту робимо один раз, а не в кожному кадрі:
       querySelectorAll шістдесят разів на секунду — марна робота, яка
       додається до кожного кадру прокрутки. */
    const manIndex = scenes.findIndex((scene) => scene.id === "s-man");
    const manScene = manIndex >= 0 ? scenes[manIndex] : null;
    const manLines =
      manIndex >= 0
        ? sceneRefs.current[manIndex]?.querySelectorAll<HTMLElement>("[data-manline]")
        : null;

    function paint() {
      /* Коефіцієнт наздоганяння: що менший, то мʼякше сцена доганяє скрол.
         Трек тепер коротший, тож те саме відставання у частках прокрутки
         означає менше пікселів — інерцію можна дозволити, не втрачаючи
         відгуку. Саме це, а не довжина треку, відповідає за плавність. */
      if (reduced) {
        progress = target;
      } else {
        const step = (target - progress) * 0.05;
        progress += Math.max(-MAX_STEP, Math.min(MAX_STEP, step));
      }
      const p = progress;

      scenes.forEach((scene, index) => {
        const el = sceneRefs.current[index];
        if (!el) return;
        const v = band(p, scene.from, scene.to);
        /* Записуємо лише те, що справді змінилось. Більшість кадрів сцена
           стоїть на плато з прозорістю 1 і нульовим зсувом; безумовний запис
           у style та dataset щокадру для восьми сцен змушував браузер щоразу
           перераховувати стилі — саме це давало дрібні ривки. */
        const opacity = (Math.round(v * 1000) / 1000).toString();
        const mid = (scene.from + scene.to) / 2;
        /* Хід сцени. `translate3d`, і ніколи `none`: перемикання між
           «є трансформація» і «немає» змушувало браузер створювати й прибирати
           композитний шар, а разом з ним — зсувати текст на цілий піксель і
           міняти згладжування. Саме це виглядало як підстрибування. */
        const shift = reduced ? 0 : (1 - v) * (p < mid ? SLIDE : -SLIDE);
        const transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;

        // Записуємо лише те, що справді змінилось: безумовний запис у style
        // щокадру для восьми сцен змушував браузер щоразу перераховувати стилі.
        if (el.dataset.o !== opacity) {
          el.dataset.o = opacity;
          // Лише прозорість: текст лишається в DOM і доступний пошуковим роботам.
          el.style.opacity = opacity;
          // Погашена сцена не повинна перехоплювати кліки по підвалу під нею.
          const off = String(v === 0);
          if (el.dataset.off !== off) el.dataset.off = off;
        }
        if (el.dataset.t !== transform) {
          el.dataset.t = transform;
          el.style.transform = transform;
        }
      });

      // Маніфест підсвічується рядок за рядком у межах своєї сцени.
      if (manScene && manLines) {
        const local = (p - manScene.from) / (manScene.to - manScene.from);
        manLines.forEach((line, i) => {
          // Запис лише при зміні: раніше атрибут перезаписувався щокадру.
          const lit = String(local > 0.18 + i * 0.22);
          if (line.dataset.lit !== lit) line.dataset.lit = lit;
        });
      }

      raf = window.requestAnimationFrame(paint);
    }

    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    raf = window.requestAnimationFrame(paint);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      document.removeEventListener("click", onAnchorClick);
      window.clearTimeout(jump);
    };
  }, [scenes]);

  return (
    <>
      {scenes.map((scene, index) => (
        <section
          key={scene.id}
          id={scene.id}
          className={`scene${scene.center ? " center" : ""}`}
          ref={(node) => {
            sceneRefs.current[index] = node;
          }}
        >
          <div className="content">{scene.content}</div>
          {scene.footer}
        </section>
      ))}
      {/* Трек прокрутки. Всередині — по одній нульовій позначці на сцену:
          з `scroll-snap-type: y proximity` браузер підтягує сторінку до
          центру найближчої сцени, тому свайп більше не зупиняється на
          порожньому фоні між блоками. `proximity`, а не `mandatory`:
          вільна прокрутка лишається можливою. */}
      <div id="track" ref={trackRef} aria-hidden>
        {scenes.map((scene) => {
          // Центр смуги видимості, а не обрізаних меж: у героя діапазон
          // починається за нулем (-0.1), і обрізання зсувало його позначку
          // на 280px замість самого верху сторінки.
          const centre = Math.min(1, Math.max(0, (scene.from + scene.to) / 2));
          return (
            <i
              key={scene.id}
              className="snap"
              style={{ top: `calc((100% - 100vh) * ${centre})` }}
            />
          );
        })}
      </div>
    </>
  );
}
