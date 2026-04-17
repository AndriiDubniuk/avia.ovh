import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  CircleDollarSign,
  Cpu,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { LogoMark } from "@/components/logo-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  complianceFacts,
  faqItems,
  operationalBenefits,
  portfolioCase,
  primaryService,
  relatedCapabilities,
  servicePackages,
  siteConfig,
  workflowSteps,
} from "@/lib/site-data";

const heroStats = [
  "Лендінги й сайти компаній",
  "MVP, кабінети та API",
  "Інтеграції й технічний запуск",
];

const iconMap = {
  Cpu,
  ShieldCheck,
  CalendarClock,
  CircleDollarSign,
  MessageSquareMore,
  Sparkles,
};

export default function Home() {
  return (
    <div className="shell grain flex-1">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(212,180,110,0.22),transparent_44%)]" />
      <div className="pointer-events-none absolute right-[-10rem] top-[12rem] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(25,55,40,0.16),transparent_64%)] blur-3xl" />
      <div className="pointer-events-none absolute left-[-8rem] top-[30rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(212,180,110,0.18),transparent_62%)] blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-white/20 bg-[#f8f3e7]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4 lg:px-8">
          <LogoMark />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground lg:flex">
            <Link href="/#services" className="hover:text-foreground">
              Послуги
            </Link>
            <Link href="/#portfolio" className="hover:text-foreground">
              Кейси
            </Link>
            <Link href="/#process" className="hover:text-foreground">
              Процес
            </Link>
            <Link href="/#offer" className="hover:text-foreground">
              Умови
            </Link>
            <Link href="/#contact" className="hover:text-foreground">
              Контакти
            </Link>
          </nav>
          <Button asChild className="h-10 w-full px-4 text-xs sm:h-11 sm:w-auto sm:px-6 sm:text-sm">
            <Link href="/#contact">Подати заявку</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <Badge variant="secondary" className="mb-6 w-fit rounded-full px-4 py-2">
                Студія вебпродуктів для бізнесу
              </Badge>
              <h1 className="section-title max-w-4xl text-5xl leading-[0.95] font-semibold text-foreground sm:text-6xl lg:text-7xl">
                Запускаємо сайти, MVP і кабінети, які вже готові до продажу й оплати
                онлайн.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                {siteConfig.description}{" "}
                Пояснюємо послуги людською мовою, показуємо стартові ціни і залишаємо
                зрозумілий сценарій заявки, щоб клієнт не губився ще до першого
                контакту.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="w-full rounded-full px-8 sm:w-auto">
                  <Link href="/#contact">
                    Обговорити задачу
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full rounded-full px-8 sm:w-auto">
                  <Link href="/#services">Подивитися пакети</Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <Badge className="rounded-full border-0 bg-primary/10 px-4 py-2 text-primary hover:bg-primary/10">
                  {siteConfig.priceLabel}
                </Badge>
                <Badge className="rounded-full border-0 bg-white/70 px-4 py-2 text-foreground hover:bg-white/70">
                  Україномовна версія
                </Badge>
                <Badge className="rounded-full border-0 bg-white/70 px-4 py-2 text-foreground hover:bg-white/70">
                  Форма зворотного зв&apos;язку
                </Badge>
              </div>
            </div>

            <div className="relative">
              <Card className="overflow-hidden border-white/40 bg-[linear-gradient(180deg,rgba(20,45,33,0.98),rgba(15,28,20,0.96))] text-primary-foreground shadow-[0_30px_120px_-45px_rgba(17,34,23,0.7)]">
                <CardHeader className="pb-6">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-white/55">
                        Що можемо закрити
                      </p>
                      <CardTitle className="mt-4 section-title text-4xl font-semibold text-white">
                        {primaryService.name}
                      </CardTitle>
                    </div>
                    <div className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/80">
                      Активно
                    </div>
                  </div>
                  <CardDescription className="max-w-lg text-base leading-7 text-white/70">
                    {primaryService.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/6 p-6 md:grid-cols-2">
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-white/55">
                        Бюджет старту
                      </p>
                      <p className="mt-3 text-4xl font-semibold text-white">
                        {siteConfig.priceLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-white/55">
                        Публічний кейс
                      </p>
                      <p className="mt-3 text-lg leading-7 text-white/82">
                        {portfolioCase.name} та інші вебпродукти під бізнес-задачу.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {heroStats.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm"
                      >
                        <div className="grid size-6 place-items-center rounded-full bg-white/10 text-white">
                          <BadgeCheck className="size-3.5" />
                        </div>
                        <span className="font-medium text-white">{item}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-full border-white/20 bg-white/8 text-white hover:bg-white/12 hover:text-white"
                  >
                    <Link href={portfolioCase.url} target="_blank" rel="noreferrer">
                      Відкрити кейс {portfolioCase.name}
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                Що клієнт бачить одразу
              </p>
              <h2 className="section-title mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
                Без «уточнюйте в менеджера» і без відчуття тимчасової заглушки.
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {operationalBenefits.map((benefit) => {
                const Icon = iconMap[benefit.icon];

                return (
                  <Card
                    key={benefit.title}
                    className="border-white/60 bg-white/70 shadow-[0_24px_80px_-50px_rgba(17,34,23,0.28)]"
                  >
                    <CardHeader>
                      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary/8 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <CardTitle className="text-2xl">{benefit.title}</CardTitle>
                      <CardDescription className="text-base leading-7 text-muted-foreground">
                        {benefit.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section id="services" className="scroll-mt-28 py-20">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                Послуги
              </p>
              <h2 className="section-title mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
                Чотири формати, з яких найчастіше стартують.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Це не прайс на все підряд, а нормальні стартові орієнтири. Далі
                бюджет залежить від обсягу, логіки, дизайну, інтеграцій і строків.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {servicePackages.map((service) => (
                <Card
                  key={service.title}
                  className="border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(249,244,233,0.9))] shadow-[0_28px_90px_-55px_rgba(17,34,23,0.35)]"
                >
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                          Послуга
                        </p>
                        <CardTitle className="section-title mt-3 text-3xl font-semibold text-foreground">
                          {service.title}
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="rounded-full px-4 py-2">
                        {service.timeline}
                      </Badge>
                    </div>
                    <CardDescription className="text-base leading-7 text-muted-foreground">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="rounded-[1.5rem] border border-primary/10 bg-primary/6 p-6">
                      <p className="text-sm uppercase tracking-[0.24em] text-primary/70">
                        Стартова ціна
                      </p>
                      <p className="mt-3 text-4xl font-semibold text-foreground">
                        {service.price}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {service.deliverables.map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-4"
                        >
                          <div className="mt-1 grid size-6 place-items-center rounded-full bg-accent/20 text-primary">
                            <BadgeCheck className="size-4" />
                          </div>
                          <p className="text-sm leading-6 text-foreground">{item}</p>
                        </div>
                      ))}
                    </div>

                    <Button asChild variant="outline" className="rounded-full px-6">
                      <Link href="/#contact">Хочу таку послугу</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="portfolio" className="scroll-mt-28 py-8">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
            <div className="grid gap-5">
              <Card className="border-primary/10 bg-primary text-primary-foreground shadow-[0_24px_80px_-50px_rgba(17,34,23,0.7)]">
                <CardHeader>
                  <CardTitle className="section-title text-3xl font-semibold text-white">
                    Інформація для онлайн-оплати
                  </CardTitle>
                  <CardDescription className="text-base leading-7 text-white/72">
                    Коротко і по ділу: що клієнт бачить перед заявкою та оплатою.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {complianceFacts.map((fact) => (
                    <div
                      key={fact}
                      className="rounded-2xl border border-white/10 bg-white/6 px-5 py-4 text-sm text-white/88"
                    >
                      {fact}
                    </div>
                  ))}

                  <Button
                    asChild
                    variant="outline"
                    className="mt-2 rounded-full border-white/20 bg-white/8 text-white hover:bg-white/12 hover:text-white"
                  >
                    <Link href={siteConfig.billingUrl} target="_blank" rel="noreferrer">
                      Відкрити billing для підписок
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-white/60 bg-white/70">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground">
                    Суміжні задачі, які теж беремо в роботу
                  </CardTitle>
                  <CardDescription className="text-base leading-7 text-muted-foreground">
                    Якщо проєкт ширший за сайт, це теж можна зібрати в адекватний
                    scope без окремої історії “шукайте ще когось”.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {relatedCapabilities.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-border/80 bg-background/70 px-5 py-4"
                    >
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(246,241,231,0.92))]">
              <CardHeader>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  {portfolioCase.eyebrow}
                </p>
                <CardTitle className="section-title text-4xl font-semibold text-foreground">
                  {portfolioCase.name}
                </CardTitle>
                <CardDescription className="text-base leading-7 text-muted-foreground">
                  {portfolioCase.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {portfolioCase.points.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/80 px-5 py-4"
                  >
                    <div className="mt-1 grid size-7 place-items-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="size-4" />
                    </div>
                    <p className="text-sm leading-6 text-foreground">{point}</p>
                  </div>
                ))}

                <div className="rounded-[1.5rem] border border-border/80 bg-background/75 px-5 py-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
                    Домен кейсу
                  </p>
                  <Link
                    href={portfolioCase.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary"
                  >
                    {portfolioCase.url.replace("https://", "")}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="process" className="scroll-mt-28 py-20">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                Процес
              </p>
              <h2 className="section-title mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
                Як виглядає співпраця від заявки до запуску.
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {workflowSteps.map((step, index) => (
                <Card key={step.title} className="border-white/55 bg-white/72">
                  <CardHeader>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
                        {index + 1}
                      </div>
                      <CardTitle className="text-2xl">{step.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base leading-7 text-muted-foreground">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="offer" className="scroll-mt-28 py-20">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                Публічні умови
              </p>
              <h2 className="section-title mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
                Клієнт одразу розуміє, що замовляє і як у це зайти.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Є напрями послуг, стартові бюджети, формат надання, порядок комунікації
                й правові сторінки. Тобто перед оплатою все виглядає як нормальний
                сервісний сайт, а не як експеримент.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild variant="outline" className="rounded-full px-7">
                  <Link href="/offer">Публічна оферта</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-7">
                  <Link href="/privacy">Політика конфіденційності</Link>
                </Button>
              </div>
            </div>

            <Card className="border-white/55 bg-white/75">
              <CardHeader>
                <CardTitle className="section-title text-3xl font-semibold text-foreground">
                  Поширені питання
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {faqItems.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-[1.5rem] border border-border/80 bg-background/75 px-5 py-5"
                  >
                    <h3 className="text-lg font-semibold text-foreground">{item.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="contact" className="scroll-mt-28 pb-24 pt-10">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Контакти
                </p>
                <h2 className="section-title mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
                  Опиши задачу в кількох рядках, а ми повернемось з оцінкою й
                  наступним кроком.
                </h2>
              </div>

              <Card className="border-primary/10 bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">
                    Що відбувається після заявки
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-6 text-white/82">
                  <p>1. Уточнюємо, що саме треба запустити і в які строки.</p>
                  <p>2. Даємо пакет або scope першого етапу з бюджетним орієнтиром.</p>
                  <p>
                    3. Після погодження клієнт переходить до онлайн-оплати етапу або в
                    окремий billing-контур для річної підписки.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/60 bg-white/72">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground">
                    Публічний контактний блок
                  </CardTitle>
                  <CardDescription className="text-base leading-7 text-muted-foreground">
                    Основний канал звернення зараз реалізований через форму заявки.
                    У ній клієнт залишає email, телефон або Telegram для продовження
                    розмови.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Портфоліо:</span>{" "}
                    <Link
                      href={portfolioCase.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-foreground"
                    >
                      {portfolioCase.url.replace("https://", "")}
                    </Link>
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Формат надання:</span>{" "}
                    дистанційно, без фізичної доставки.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Мова сайту:</span>{" "}
                    українська.
                  </p>
                </CardContent>
              </Card>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/40 bg-white/45">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="font-medium text-foreground">{siteConfig.name}</p>
            <p className="mt-1">
              Digital-студія з розробки сайтів, вебсервісів, інтеграцій і MVP.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/offer" className="hover:text-foreground">
              Публічна оферта
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Політика конфіденційності
            </Link>
            <Link href="/#contact" className="hover:text-foreground">
              Подати заявку
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
