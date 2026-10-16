"use client";

import Link from "next/link";

import { useHref, useLang } from "@/components/lang-provider";
import { Reveal } from "@/components/reveal";
import { Shell } from "@/components/service-view";
import {
  BLOG_HUB,
  BLOG_SLUGS,
  formatDate,
  getArticle,
  getArticles,
  splitLinks,
  type Block,
  type BlogSlug,
} from "@/lib/blog";

/**
 * Рядок із посиланнями `[текст](/шлях)`. Внутрішні шляхи локалізуються, тож
 * англійська стаття веде на англійські сторінки. Видимий текст збігається з
 * тим, що потрапляє в JSON-LD (`plainText`).
 */
function Rich({ text }: { text: string }) {
  const href = useHref();
  return (
    <>
      {splitLinks(text).map((part, index) =>
        "href" in part ? (
          part.href.startsWith("/") ? (
            <Link key={index} href={href(part.href)}>
              {part.text}
            </Link>
          ) : (
            <a key={index} href={part.href} target="_blank" rel="noopener">
              {part.text}
            </a>
          )
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  if ("ul" in block) {
    return (
      <ul>
        {block.ul.map((item) => (
          <li key={item}>
            <Rich text={item} />
          </li>
        ))}
      </ul>
    );
  }
  if ("ol" in block) {
    return (
      <ol>
        {block.ol.map((item) => (
          <li key={item}>
            <Rich text={item} />
          </li>
        ))}
      </ol>
    );
  }
  return (
    <p>
      <Rich text={block.p} />
    </p>
  );
}

/** Дата й автор — видимі, це сигнал довіри (E-E-A-T) для пошуковика й читача. */
function Byline({ iso }: { iso: string }) {
  const { lang } = useLang();
  const hub = BLOG_HUB[lang];
  return (
    <p className="note mt-6">
      {hub.published} <time dateTime={iso}>{formatDate(lang, iso)}</time> · {hub.author}
    </p>
  );
}

export function ArticleView({ slug }: { slug: BlogSlug }) {
  const { lang } = useLang();
  const href = useHref();
  const hub = BLOG_HUB[lang];
  const article = getArticle(lang, slug);

  return (
    <Shell crumbs={[{ label: hub.name, href: href("/blog") }, { label: article.h1 }]}>
      <article>
        {/* Не <header>: глобальний стиль `header` (шапка сайту) робить його
            position: fixed — заголовок статті прилипав до верху й наїжджав на текст. */}
        <div>
          <Reveal>
            <div className="eyebrow">{hub.eyebrow}</div>
            <h1 className="mid">{article.h1}</h1>
            <Byline iso={article.published} />
            {article.lead.map((block, index) =>
              "p" in block ? (
                <p key={index} className="sub">
                  <Rich text={block.p} />
                </p>
              ) : (
                <BlockView key={index} block={block} />
              ),
            )}
          </Reveal>
        </div>

        {/* Текст статті — у верстці юридичних документів: нумеровані секції,
            читабельна ширина рядка. Кожна секція — H2-питання з копірайту. */}
        <div className="doc mt-10">
          {article.sections.map((section, index) => (
            <Reveal key={section.h2}>
              <section className="art">
                <p className="num">{String(index + 1).padStart(2, "0")}</p>
                <div>
                  <h2>{section.h2}</h2>
                  {section.blocks.map((block, blockIndex) => (
                    <BlockView key={blockIndex} block={block} />
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
        </div>

        <section className="sec" id="faq">
          <Reveal>
            <h2 className="mid">{hub.faqTitle}</h2>
          </Reveal>
          <div className="qa mt-7">
            {article.faq.map((item, index) => (
              <Reveal key={item.question} delay={index * 40}>
                <article>
                  <h3>{item.question}</h3>
                  <p>
                    <Rich text={item.answer} />
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="sec">
          <Reveal>
            <p className="sub prose-links">
              <Rich text={article.outro} />
            </p>
            <div className="actions mt-7">
              <Link href={href("/blog")} className="ghost">
                {hub.all}
              </Link>
            </div>
          </Reveal>
        </section>
      </article>
    </Shell>
  );
}

export function BlogHubView() {
  const { lang } = useLang();
  const href = useHref();
  const hub = BLOG_HUB[lang];
  const all = getArticles(lang);

  return (
    <Shell crumbs={[{ label: hub.name }]}>
      <section>
        <Reveal>
          <div className="eyebrow">{hub.eyebrow}</div>
          <h1 className="mid">{hub.title}</h1>
          <p className="sub">{hub.sub}</p>
        </Reveal>
        <Reveal>
          <ul className="tcards mt-8">
            {BLOG_SLUGS.map((slug) => (
              <li key={slug} className="tcard">
                <h3>
                  <Link href={href(`/blog/${slug}`)}>{all[slug].h1}</Link>
                </h3>
                <p>{all[slug].metaDescription}</p>
                <p>
                  <time dateTime={all[slug].published}>
                    {formatDate(lang, all[slug].published)}
                  </time>
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
    </Shell>
  );
}
