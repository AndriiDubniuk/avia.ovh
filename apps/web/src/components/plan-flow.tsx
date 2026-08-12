"use client";

import { useEffect, useRef, useState } from "react";

import { useLang } from "@/components/lang-provider";

/**
 * Скільки тримається одна стадія, мс. Чотири картки по два-три рядки —
 * 6 секунд на них не вистачало, читач не встигав дійти до останньої.
 */
const STAGE_MS = 11000;

/** Скільки бездіяльності після ручного вибору чекати до відновлення циклу. */
const RESUME_MS = 30000;

/**
 * Процес показуємо стадіями, а не чотирма стовпцями одразу: спершу картка
 * стадії («Бриф»), з неї по черзі розлітаються картки її підетапів, далі
 * цикл переходить на наступну стадію і по колу повертається на першу.
 *
 * Стадії також клікабельні — хто читає уважно, не мусить чекати таймера.
 *
 * Реакція на `prefers-reduced-motion` живе в CSS: якби вона впливала на
 * розмітку, серверний і клієнтський рендер розійшлись би на гідрації.
 */
export function PlanFlow() {
  const { t } = useLang();
  const steps = t.plan.steps;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  // Стартуємо з true: якщо IntersectionObserver недоступний, цикл усе одно йде.
  const [inView, setInView] = useState(true);
  /**
   * Мітка часу останнього ручного вибору. Поки вона свіжа, автопрокрутка
   * мовчить — інакше таймер відбирав би керування просто під час читання.
   * Через `RESUME_MS` бездіяльності цикл повертається сам: раніше один клік
   * зупиняв його назавжди, до перезавантаження сторінки.
   */
  const [pickedAt, setPickedAt] = useState<number | null>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => setInView(entry.isIntersecting)),
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Після ручного вибору чекаємо RESUME_MS, і лише тоді знову крутимо.
    const idleLeft = pickedAt === null ? 0 : RESUME_MS - (Date.now() - pickedAt);

    if (idleLeft > 0) {
      const resume = window.setTimeout(() => setPickedAt(null), idleLeft);
      return () => window.clearTimeout(resume);
    }

    const timer = window.setInterval(() => {
      // +1 по колу: після останньої стадії цикл стартує заново.
      setActive((index) => (index + 1) % steps.length);
    }, STAGE_MS);

    return () => window.clearInterval(timer);
  }, [inView, pickedAt, steps.length]);

  const stage = steps[active];

  return (
    <div className="planflow" ref={rootRef}>
      <div className="planrail" role="tablist" aria-label={t.plan.eyebrow}>
        {steps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            role="tab"
            aria-selected={index === active}
            className="planchip"
            data-state={
              index === active ? "active" : index < active ? "past" : "next"
            }
            onClick={() => {
              setActive(index);
              setPickedAt(Date.now());
            }}
          >
            <span className="chipno">{String(index + 1).padStart(2, "0")}</span>
            <span className="chipph">{step.phase}</span>
            <span className="chiptitle">{step.title}</span>
          </button>
        ))}
      </div>

      {/* key за індексом стадії: зміна стадії перемонтовує блок, і CSS-анімація
          вильоту карток стартує заново, а не лишається відіграною.
          Окремої картки стадії тут немає — вона дослівно повторювала активний
          чіп угорі, тож лишаємо тільки підетапи. */}
      <div className="planstage" key={active}>
        <div className="stageitems">
          {stage.items.map((item, index) => (
            <article
              key={item.title}
              className="stageitem"
              style={{ ["--i" as string]: index }}
            >
              <p className="sino">{String(index + 1).padStart(2, "0")}</p>
              {/* h3, а не h4: найближчий предок — h2 секції, і пропуск рівня
                  ламав би ієрархію заголовків. */}
              <h3>{item.title}</h3>
              <p className="sitext">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
