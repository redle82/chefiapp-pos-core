/**
 * CashDrawerButton — Botao para abrir gaveta de dinheiro no toolbar do TPV.
 *
 * - Icone de gaveta/caixa
 * - Click: abre a gaveta via ESC/POS (WebUSB)
 * - Feedback visual: flash verde breve no sucesso
 * - Toast de erro em caso de falha
 * - Estado desativado quando nenhuma impressora conectada
 */

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCashDrawer } from "../../hooks/useCashDrawer";

/** Duration of the success flash animation in ms */
const SUCCESS_FLASH_DURATION_MS = 800;

export function CashDrawerButton() {
  const { t } = useTranslation();
  const { isAvailable, open, error } = useCashDrawer();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(async () => {
    if (isOpening) return;
    setIsOpening(true);

    try {
      await open();

      // Flash green briefly on success
      setShowSuccess(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => {
        setShowSuccess(false);
      }, SUCCESS_FLASH_DURATION_MS);
    } catch {
      // Error is already set in the hook state
    } finally {
      setIsOpening(false);
    }
  }, [isOpening, open]);

  // Derive button visual state
  const baseClasses =
    "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1";

  const stateClasses = showSuccess
    ? "bg-green-500 text-white ring-green-300"
    : isAvailable
      ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
      : "bg-neutral-50 text-neutral-400 cursor-not-allowed dark:bg-neutral-900 dark:text-neutral-600";

  const title = !isAvailable
    ? t("pos:cashDrawer.noDevice", "Nenhuma impressora USB conectada")
    : showSuccess
      ? t("pos:cashDrawer.opened", "Gaveta aberta!")
      : t("pos:cashDrawer.open", "Abrir gaveta");

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        data-testid="cash-drawer-button"
        type="button"
        onClick={handleClick}
        disabled={!isAvailable && !showSuccess}
        className={`${baseClasses} ${stateClasses}`}
        title={title}
        aria-label={title}
      >
        {/* Cash drawer icon (SVG) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          {/* Drawer body */}
          <rect x="2" y="6" width="20" height="12" rx="2" />
          {/* Drawer slide line */}
          <line x1="2" y1="14" x2="22" y2="14" />
          {/* Cash tray compartments */}
          <line x1="8" y1="14" x2="8" y2="18" />
          <line x1="16" y1="14" x2="16" y2="18" />
          {/* Coin area */}
          <circle cx="12" cy="10" r="1.5" />
        </svg>

        {isOpening && (
          <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
        )}
      </button>

      {/* Error toast (appears below the button) */}
      {error && !showSuccess && (
        <div
          role="alert"
          data-testid="cash-drawer-error"
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-64 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 shadow-lg dark:bg-red-950 dark:border-red-800 dark:text-red-300"
        >
          {error}
        </div>
      )}
    </div>
  );
}
