/**
 * StaffHistoryPage — Tarefas, turnos e acções do operador.
 */

import { colors } from "../../../ui/design-system/tokens/colors";

export function StaffHistoryPage() {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: colors.text.primary }}>
        Meu histórico
      </h1>
      <div
        style={{
          backgroundColor: colors.surface.layer1,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${colors.border.subtle}`,
          color: colors.text.secondary,
          fontSize: 14,
        }}
      >
        Nenhum histórico de tarefas ou turnos neste dispositivo.
      </div>
    </div>
  );
}
