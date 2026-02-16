/**
 * DeviceBlockedScreen — Ecrã de bloqueio quando o Device Gate falha
 *
 * Mostra título, descrição e CTA quando o dispositivo não está instalado,
 * não pertence ao restaurante, não está na Config ou está desativado.
 * CONFIG_RUNTIME_CONTRACT: docs/contracts/CONFIG_RUNTIME_CONTRACT.md §2.2, §2.3.
 */

import { GlobalBlockedView } from "../../ui/design-system/components";
import type { DeviceBlockedReason } from "./useDeviceGate";

/** Rota canónica para instalar TPV/KDS (agora integrado no Hub Módulos). */
const INSTALL_APP = "/admin/modules";

const COPY: Record<
  DeviceBlockedReason,
  { title: string; description: string; actionLabel: string; defaultTo: string }
> = {
  DEVICE_NOT_INSTALLED: {
    title: "Dispositivo não instalado",
    description:
      "Este terminal ainda não está vinculado ao restaurante. Ative-o na Web de Configuração (Instalar TPV/KDS) para operar.",
    actionLabel: "Ir para Instalação",
    defaultTo: INSTALL_APP,
  },
  DEVICE_RESTAURANT_MISMATCH: {
    title: "Dispositivo de outro restaurante",
    description:
      "Este terminal está vinculado a outro restaurante. Use o terminal correto ou altere a vinculação na Web de Configuração.",
    actionLabel: "Ir para Configuração",
    defaultTo: INSTALL_APP,
  },
  DEVICE_NOT_IN_CONFIG: {
    title: "Dispositivo não autorizado",
    description:
      "Este dispositivo não está autorizado. Ative-o na Web de Configuração.",
    actionLabel: "Ir para Configuração",
    defaultTo: INSTALL_APP,
  },
  DEVICE_DISABLED: {
    title: "Dispositivo desativado",
    description:
      "Este dispositivo foi desativado na Web de Configuração. Ative-o em Configuração > Dispositivos para continuar a operar.",
    actionLabel: "Ir para Configuração",
    defaultTo: INSTALL_APP,
  },
};

export interface DeviceBlockedScreenProps {
  reason?: DeviceBlockedReason;
  redirectTo?: string;
}

export function DeviceBlockedScreen({
  reason,
  redirectTo,
}: DeviceBlockedScreenProps) {
  if (!reason) {
    return (
      <GlobalBlockedView
        title="Dispositivo não autorizado"
        description="Não foi possível validar este terminal. Ative-o na Web de Configuração para operar."
        action={{ label: "Ir para Configuração", to: INSTALL_APP }}
      />
    );
  }

  const copy = COPY[reason];
  const to = redirectTo ?? copy.defaultTo;

  return (
    <GlobalBlockedView
      title={copy.title}
      description={copy.description}
      action={{ label: copy.actionLabel, to }}
    />
  );
}
