import { isElectron } from "../operational/platformDetection";

export type DesktopPrinterInfo = {
  name: string;
  isDefault: boolean;
  status: string;
};

export async function getDesktopPrinters(): Promise<{
  data: DesktopPrinterInfo[];
  error: { message: string } | null;
}> {
  if (!isElectron() || !window.electronBridge?.getPrinters) {
    return { data: [], error: { message: "DESKTOP_APP_REQUIRED" } };
  }

  try {
    const data = await window.electronBridge.getPrinters();
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "GET_PRINTERS_FAILED";
    return { data: [], error: { message } };
  }
}
