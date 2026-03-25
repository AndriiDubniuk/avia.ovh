"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { siteConfig } from "@/lib/site-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Вкажіть ім'я або ім'я контактної особи."),
  companyName: z.string().trim().max(80, "Назва компанії занадто довга.").optional(),
  email: z.email("Вкажіть коректний email."),
  contact: z.string().trim().min(3, "Вкажіть телефон або Telegram."),
  serviceName: z.string().trim().min(3, "Вкажіть назву послуги."),
  message: z
    .string()
    .trim()
    .min(10, "Коротко опишіть задачу, очікуваний результат або формат продукту."),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const defaultValues: ContactFormValues = {
  name: "",
  companyName: "",
  email: "",
  contact: "",
  serviceName: siteConfig.primaryServiceName,
  message: "",
};

export function ContactForm() {
  const [feedback, setFeedback] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({
    type: "idle",
    message: "",
  });

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  });

  async function onSubmit(values: ContactFormValues) {
    setFeedback({ type: "idle", message: "" });

    try {
      const response = await fetch(`${siteConfig.apiBaseUrl}/contact-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.message ?? "Не вдалося зберегти заявку. Спробуйте ще раз трохи пізніше.",
        );
      }

      form.reset(defaultValues);
      setFeedback({
        type: "success",
        message:
          "Заявку збережено. Ми повернемося з оцінкою, етапами та деталями по запуску.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Сталася помилка під час надсилання форми.",
      });
    }
  }

  return (
    <Card className="border-white/65 bg-white/82 shadow-[0_28px_100px_-55px_rgba(17,34,23,0.35)]">
      <CardHeader>
        <CardTitle className="section-title text-3xl font-semibold text-foreground">
          Подати заявку
        </CardTitle>
        <CardDescription className="text-base leading-7 text-muted-foreground">
          Кілька рядків про задачу достатньо. Далі повернемось з оцінкою і
          зрозумілим планом старту.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Ім'я"
              error={form.formState.errors.name?.message}
              input={
                <Input
                  placeholder="Наприклад, Андрій"
                  {...form.register("name")}
                />
              }
            />

            <Field
              label="Назва компанії"
              error={form.formState.errors.companyName?.message}
              input={
                <Input
                  placeholder="Наприклад, Monibex"
                  {...form.register("companyName")}
                />
              }
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Email"
              error={form.formState.errors.email?.message}
              input={
                <Input
                  type="email"
                  placeholder="name@company.com"
                  {...form.register("email")}
                />
              }
            />

            <Field
              label="Телефон або Telegram"
              error={form.formState.errors.contact?.message}
              input={
                <Input
                  placeholder="+380... або @nickname"
                  {...form.register("contact")}
                />
              }
            />
          </div>

          <Field
            label="Послуга"
            error={form.formState.errors.serviceName?.message}
            input={<Input {...form.register("serviceName")} />}
          />

          <Field
            label="Коротко про задачу"
            error={form.formState.errors.message?.message}
            input={
              <Textarea
                placeholder="Опишіть, що потрібно розробити: лендінг, корпоративний сайт, MVP, кабінет або інтеграцію."
                {...form.register("message")}
              />
            }
          />

          <div className="flex flex-col gap-4 rounded-[1.5rem] border border-border/80 bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
            <p>
              Натискаючи кнопку, ви погоджуєтеся з{" "}
              <Link href="/offer" className="font-medium text-foreground underline">
                публічною офертою
              </Link>{" "}
              та{" "}
              <Link href="/privacy" className="font-medium text-foreground underline">
                політикою конфіденційності
              </Link>
              .
            </p>

            {feedback.type !== "idle" ? (
              <p
                aria-live="polite"
                className={
                  feedback.type === "success"
                    ? "font-medium text-primary"
                    : "font-medium text-destructive"
                }
              >
                {feedback.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-[1.4rem]"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Надсилаємо..." : "Надіслати заявку"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  input,
  error,
}: {
  label: string;
  input: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="grid gap-2.5 text-sm font-medium text-foreground">
      <span>{label}</span>
      {input}
      {error ? <span className="text-sm font-normal text-destructive">{error}</span> : null}
    </label>
  );
}
