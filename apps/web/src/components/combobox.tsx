"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

export type ComboOption = { id: string; label: string };

/**
 * Список із пошуком під канал зв'язку. Нативний <select> тут не підходить:
 * варіантів багато, їх треба фільтрувати, а вигляд системного випадайника
 * не тримається макета. Тому — кнопка + попап зі списком і повна
 * клавіатурна навігація, як вимагає патерн combobox у WAI-ARIA.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  noResults,
  invalid,
  describedBy,
}: {
  options: ComboOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  noResults: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const selected = options.find((option) => option.id === value) ?? null;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  /** Список звузився — підсвітка могла лишитись за його межами. */
  function search(next: string) {
    setQuery(next);
    setActive(0);
  }

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  function pick(option: ComboOption) {
    onChange(option.id);
    close();
    buttonRef.current?.focus();
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, filtered.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[active];
      if (option) pick(option);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      buttonRef.current?.focus();
    }
  }

  return (
    <div className="cbx" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="cbx-btn"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        data-empty={selected ? undefined : true}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <i aria-hidden data-open={open} />
      </button>

      {open ? (
        <div className="cbx-pop">
          <input
            ref={searchRef}
            type="text"
            className="cbx-search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => search(event.target.value)}
            onKeyDown={onSearchKeyDown}
            aria-controls={listId}
            aria-autocomplete="list"
          />

          <ul className="cbx-list" id={listId} role="listbox">
            {filtered.map((option, index) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.id === value}
                  data-active={index === active || undefined}
                  className="cbx-opt"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(option)}
                >
                  {option.label}
                </button>
              </li>
            ))}

            {filtered.length === 0 ? <li className="cbx-empty">{noResults}</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
