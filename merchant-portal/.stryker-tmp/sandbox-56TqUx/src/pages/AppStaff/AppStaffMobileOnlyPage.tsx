/**
 * AppStaffMobileOnlyPage — Web
 *
 * AppStaff roda exclusivamente em iOS/Android (simulador ou dispositivo).
 * No merchant-portal (web) não se renderiza o terminal staff; esta página
 * informa que o AppStaff está disponível apenas no app mobile.
 *
 * Contrato: CORE_APPSTAFF_CONTRACT — AppStaff = Mobile Terminal oficial.
 */
// @ts-nocheck


import { useNavigate } from "react-router-dom";

export function AppStaffMobileOnlyPage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm"
      data-chefiapp-os="appstaff-mobile-only"
    >
      <div className="text-6xl mb-6" aria-hidden>
        📱
      </div>
      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 mb-3">
        Módulo Mobile — não configurável via web
      </span>
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
        AppStaff — disponível apenas no app mobile
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 max-w-md mb-8 leading-relaxed">
        O terminal do staff (garçom / salão) roda em <strong>iOS</strong> e{" "}
        <strong>Android</strong>. Use o simulador ou o dispositivo com o app
        instalado para aceder a tarefas, mini KDS, mini TPV, check-in e
        comunicação operacional.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full py-3 px-6 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Voltar ao Portal
        </button>
      </div>

      <div className="text-sm text-neutral-500 dark:text-neutral-500 space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-6 w-full max-w-md">
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-2">
          Documentação: <code className="text-xs">docs/routes/web/appstaff-web.md</code>
        </p>
        <p className="font-medium mb-1">Comandos para desenvolvedores:</p>
        <p>
          iOS Simulator:{" "}
          <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-xs">
            npm run ios
          </code>{" "}
          no projecto <code className="text-xs">mobile-app</code>
        </p>
        <p>
          Android Emulator:{" "}
          <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-xs">
            npm run android
          </code>{" "}
          no projecto <code className="text-xs">mobile-app</code>
        </p>
      </div>
    </div>
  );
}
