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

/** Трикутне вікно: 1 у центрі діапазону, 0 на краях. */
function band(x: number, a: number, b: number) {
  const centre = (a + b) / 2;
  const half = (b - a) / 2;
  return Math.max(0, 1 - Math.abs(x - centre) / half);
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
      window.scrollTo({ top: track.offsetTop + scrollable * centre });
      read();
      progress = target;
    }
    const jump = window.setTimeout(jumpToHash, 60);

    function paint() {
      progress += (target - progress) * (reduced ? 1 : 0.075);
      const p = progress;

      scenes.forEach((scene, index) => {
        const el = sceneRefs.current[index];
        if (!el) return;
        const v = band(p, scene.from, scene.to);
        const opacity = v < 0.12 ? 0 : Math.min(1, (v - 0.12) / 0.5);
        // Лише прозорість: текст лишається в DOM і доступний пошуковим роботам.
        el.style.opacity = String(opacity);
        // Погашена сцена не повинна перехоплювати кліки по підвалу під нею.
        el.dataset.off = String(opacity === 0);
        if (!reduced) {
          const mid = (scene.from + scene.to) / 2;
          el.style.transform = `translateY(${(1 - v) * (p < mid ? 46 : -46)}px)`;
        }
      });

      // Маніфест підсвічується рядок за рядком у межах своєї сцени.
      const manIndex = scenes.findIndex((scene) => scene.id === "s-man");
      if (manIndex >= 0) {
        const scene = scenes[manIndex];
        const el = sceneRefs.current[manIndex];
        const lines = el?.querySelectorAll<HTMLElement>("[data-manline]");
        if (lines) {
          const local = (p - scene.from) / (scene.to - scene.from);
          lines.forEach((line, i) => {
            line.dataset.lit = String(local > 0.18 + i * 0.22);
          });
        }
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
