/**
 * LocaleSwitcher — dropdown para trocar o idioma da aplicação.
 *
 * Persiste a escolha em localStorage e aplica via i18next.changeLanguage().
 * Compacto: mostra apenas a bandeira do idioma atual (expandível ao clicar).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const LOCALE_STORAGE_KEY = "chefiapp_locale";

interface LocaleOption {
  code: string;
  flag: string;
  label: string;
}

const LOCALES: LocaleOption[] = [
  { code: "pt-PT", flag: "🇵🇹", label: "Português (PT)" },
  { code: "pt-BR", flag: "🇧🇷", label: "Português (BR)" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
];

export function LocaleSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === i18n.language) ?? LOCALES[0];

  const handleChange = useCallback(
    (code: string) => {
      void i18n.changeLanguage(code);
      localStorage.setItem(LOCALE_STORAGE_KEY, code);
      setOpen(false);
    },
    [i18n],
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-sm"
        aria-label={`Language: ${current.label}`}
        title={current.label}
      >
        <span className="text-lg leading-none">{current.flag}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-lg bg-[#1e1e2e] border border-white/10 shadow-xl z-50 py-1">
          {LOCALES.map((locale) => (
            <button
              key={locale.code}
              type="button"
              onClick={() => handleChange(locale.code)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 transition-colors ${
                locale.code === current.code
                  ? "text-amber-400 font-medium"
                  : "text-white/80"
              }`}
            >
              <span className="text-lg leading-none">{locale.flag}</span>
              <span>{locale.label}</span>
              {locale.code === current.code && (
                <span className="ml-auto text-amber-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
