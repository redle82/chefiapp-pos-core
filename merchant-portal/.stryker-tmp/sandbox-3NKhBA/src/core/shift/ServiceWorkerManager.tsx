// @ts-nocheck
import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Logger } from "../logger";
import { useShiftLock } from "./useShiftLock";

export const ServiceWorkerManager = () => {
  const { isShiftOpen } = useShiftLock();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      Logger.info("SW Registered", { context: "ServiceWorkerManager" });
    },
    onRegisterError(error: any) {
      Logger.error("SW Registration Failed", error, {
        context: "ServiceWorkerManager",
      });
    },
  });

  const [canUpdate, setCanUpdate] = useState(false);

  useEffect(() => {
    // If update is available...
    if (needRefresh) {
      if (isShiftOpen) {
        // LAW: IMMUTABLE SHIFT - DO NOT UPDATE
        Logger.warn("Update available but BLOCKED by Active Shift", {
          context: "ServiceWorkerManager",
          severity: "operational-protection",
        });
        setCanUpdate(false);
      } else {
        // Shift is closed, we can prompt the user
        setCanUpdate(true);
      }
    } else {
      setCanUpdate(false);
    }
  }, [needRefresh, isShiftOpen]);

  if (!canUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-slate-700 text-white p-4 rounded-lg shadow-2xl animate-bounce-in">
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-amber-500">Nova Versão Disponível</h3>
        <p className="text-sm text-slate-300">
          O sistema está pronto para atualizar.
        </p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => updateServiceWorker(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded font-bold text-sm transition-colors"
          >
            Atualizar Agora
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm transition-colors"
          >
            Mais Tarde
          </button>
        </div>
      </div>
    </div>
  );
};
