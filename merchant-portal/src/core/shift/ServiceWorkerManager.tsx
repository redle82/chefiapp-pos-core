import { useEffect } from "react";
import { Logger } from "../logger";

/**
 * PWA foi descontinuado para AppStaff/web operacional.
 * Mantemos o componente como no-op para preservar a API e evitar imports quebrados.
 */
export const ServiceWorkerManager = () => {
  useEffect(() => {
    Logger.info("ServiceWorkerManager disabled: PWA deprecated", {
      context: "ServiceWorkerManager",
    });
  }, []);

  return null;
};
