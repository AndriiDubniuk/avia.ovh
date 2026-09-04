"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Combobox } from "@/components/combobox";
import { useHref, useLang } from "@/components/lang-provider";
import { userMessage } from "@/lib/errors";
import { siteConfig } from "@/lib/site-data";

export function ContactForm() {
  const { t, lang } = useLang();
  const href = useHref();

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t.form.fields.name.error),
        companyName: z
          .string()
          .trim()
          .max(80, t.form.fields.company.error)
          .optional(),
        email: z.email(t.form.fields.email.error),
        contactMethod: z.string().min(1, t.form.fields.contact.methodError),
        // 60 символів + найдовша назва каналу лишаються в межах 80, які приймає поле `contact` на боці API.
        contactValue: z
          .string()
          .trim()
          .min(3, t.form.fields.contact.error)
          .max(60, t.form.fields.contact.error),
        serviceName: z.string().trim().min(3, t.form.fields.service.error),
        message: z.string().trim().min(10, t.form.fields.message.error),
      }),
    [t],
  );

  type ContactFormValues = z.infer<typeof schema>;

  const defaultValues = useMemo<ContactFormValues>(
    () => ({
      name: "",
      companyName: "",
      email: "",
      contactMethod: "",
      contactValue: "",
      serviceName: t.form.serviceDefault,
      message: "",
    }),
    [t],
  );

  const [feedback, setFeedback] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const contactMethod = form.watch("contactMethod");
  const selectedMethod = t.form.fields.contact.methods.find(
    (item) => item.id === contactMethod,
  );

  // Мова змінилась — оновлюємо підставлену назву послуги, якщо її не редагували.
  useEffect(() => {
    const current = form.getValues("serviceName");
    const isUntouched = !form.formState.dirtyFields.serviceName;
    if (isUntouched && current !== t.form.serviceDefault) {
      form.setValue("serviceName", t.form.serviceDefault);
    }
    setFeedback({ type: "idle", message: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  async function onSubmit(values: ContactFormValues) {
    setFeedback({ type: "idle", message: "" });

    // API приймає один рядок `contact`, тому канал і значення склеюємо тут:
    // так контракт бекенда лишається незмінним, а менеджер бачить, куди писати.
    const method = t.form.fields.contact.methods.find(
      (item) => item.id === values.contactMethod,
    );
    const payload = {
      name: values.name,
      companyName: values.companyName,
      email: values.email,
      serviceName: values.serviceName,
      message: values.message,
      contact: method
        ? `${method.label}: ${values.contactValue}`
        : values.contactValue,
    };

    try {
      const response = await fetch(
        `${siteConfig.apiBaseUrl}/v1/contact-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.message ?? t.form.errorRequest);
      }

      form.reset(defaultValues);
      setFeedback({ type: "success", message: t.form.success });
    } catch (error) {
      setFeedback({
        type: "error",
        message: userMessage(error, t.form.errorGeneric),
      });
    }
  }

  return (
    <div className="panel">
      <p className="ptag">{t.form.tag}</p>
      <h2>{t.form.title}</h2>
      <p>{t.form.lead}</p>

      <form className="mt-7 grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label={t.form.fields.name.label}
            error={form.formState.errors.name?.message}
            input={
              <input
                type="text"
                placeholder={t.form.fields.name.placeholder}
                {...form.register("name")}
              />
            }
          />
          <Field
            label={t.form.fields.company.label}
            error={form.formState.errors.companyName?.message}
            input={
              <input
                type="text"
                placeholder={t.form.fields.company.placeholder}
                {...form.register("companyName")}
              />
            }
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label={t.form.fields.email.label}
            error={form.formState.errors.email?.message}
            input={
              <input
                type="email"
                placeholder={t.form.fields.email.placeholder}
                {...form.register("email")}
              />
            }
          />
          <Field
            label={t.form.fields.contact.methodLabel}
            error={form.formState.errors.contactMethod?.message}
            native={false}
            input={
              <Combobox
                options={t.form.fields.contact.methods}
                value={contactMethod}
                onChange={(id) =>
                  form.setValue("contactMethod", id, {
                    shouldValidate: form.formState.isSubmitted,
                  })
                }
                placeholder={t.form.fields.contact.methodPlaceholder}
                searchPlaceholder={t.form.fields.contact.searchPlaceholder}
                noResults={t.form.fields.contact.noResults}
                invalid={Boolean(form.formState.errors.contactMethod)}
              />
            }
          />
        </div>

        <Field
          label={t.form.fields.contact.label}
          error={form.formState.errors.contactValue?.message}
          input={
            <input
              type={selectedMethod?.id === "phone" ? "tel" : "text"}
              // Поле лишається доступним завжди, але без обраного каналу
              // підказка не має сенсу — тому просимо спершу обрати канал.
              placeholder={
                selectedMethod?.placeholder ??
                t.form.fields.contact.methodPlaceholder
              }
              {...form.register("contactValue")}
            />
          }
        />

        <Field
          label={t.form.fields.service.label}
          error={form.formState.errors.serviceName?.message}
          input={<input type="text" {...form.register("serviceName")} />}
        />

        <Field
          label={t.form.fields.message.label}
          error={form.formState.errors.message?.message}
          input={
            <textarea
              placeholder={t.form.fields.message.placeholder}
              {...form.register("message")}
            />
          }
        />

        <p className="consent">
          {t.form.consent.before}
          <Link href={href("/offer")}>{t.form.consent.offer}</Link>
          {t.form.consent.middle}
          <Link href={href("/privacy")}>{t.form.consent.privacy}</Link>
          {t.form.consent.after}
        </p>

        {feedback.type !== "idle" ? (
          <p
            aria-live="polite"
            className={feedback.type === "success" ? "alert alert-ok" : "alert"}
          >
            {feedback.message}
          </p>
        ) : null}

        <button
          type="submit"
          className="cta"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t.form.submitting : t.form.submit}
        </button>
      </form>
    </div>
  );
}

/**
 * `native` = false для контролів, які не є нативним інпутом (combobox):
 * <label>, що обгортає кнопку, дає вкладений інтерактив і подвійний клік,
 * тому в такому разі рендеримо звичайний <div>.
 */
function Field({
  label,
  input,
  error,
  native = true,
}: {
  label: string;
  input: React.ReactNode;
  error?: string;
  native?: boolean;
}) {
  const content = (
    <>
      <span>{label}</span>
      {input}
      {error ? <span className="err">{error}</span> : null}
    </>
  );

  return native ? (
    <label className="field grid gap-2.5">{content}</label>
  ) : (
    <div className="field grid gap-2.5">{content}</div>
  );
}
