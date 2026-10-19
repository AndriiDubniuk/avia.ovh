"use client";

import { useEffect, useState } from "react";

import { ContactForm } from "@/components/contact-form";
import { useLang } from "@/components/lang-provider";

/** Скільки показується кожна фраза заголовка, мс. */
const PHRASE_MS = 3000;

/**
 * Перший екран головної: текст ліворуч, форма заявки праворуч.
 *
 * Форма — той самий ContactForm, що на /contact: одна реалізація, однакова
 * поведінка й валідація. Компактний вигляд задають стилі `.hero-form` у
 * globals.css, тож /contact вони не зачіпають.
 */
export function HeroIntro() {
  const { t } = useLang();
  const phrases = t.hero.rotating;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % phrases.length),
      PHRASE_MS,
    );
    return () => window.clearInterval(id);
  }, [phrases.length]);

  return (
    <div className="hero-split">
      <div>
        <div className="eyebrow">{t.hero.eyebrow}</div>
        {/* Усі фрази в розмітці: пошуковик бачить повний заголовок, а
            скрінрідер — лише поточну фразу. */}
        <h1 className="mid rotor">
          {phrases.map(([before, accent, after], i) => (
            <span key={accent} data-on={i === index} aria-hidden={i !== index}>
              {before}
              <em>{accent}</em>
              {after}
            </span>
          ))}
        </h1>
        <p className="sub">{t.hero.sub}</p>
      </div>

      <div className="hero-form">
        <ContactForm />
      </div>
    </div>
  );
}
