/**
 * TPVSettingsPage — Definições do TPV (rota /op/tpv/settings).
 * Navegação: sidebar já resolve (sem botão redundante "Voltar ao POS").
 */
// @ts-nocheck


export function TPVSettingsPage() {
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ color: "var(--text-primary)", marginBottom: 12 }}>
        Definições do TPV
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Idioma */}
        <section>
          <h3 style={{ color: "var(--text-primary)", marginBottom: 8 }}>
            🌐 Idioma
          </h3>
          <select
            disabled
            style={{
              background: "var(--surface-elevated, #1a1a1a)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle, #333)",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 14,
              opacity: 0.6,
            }}
          >
            <option>Português (PT)</option>
          </select>
          <p
            style={{
              color: "var(--text-tertiary, #666)",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Em breve: multi-idioma.
          </p>
        </section>

        {/* Moeda */}
        <section>
          <h3 style={{ color: "var(--text-primary)", marginBottom: 8 }}>
            💰 Moeda
          </h3>
          <select
            disabled
            style={{
              background: "var(--surface-elevated, #1a1a1a)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle, #333)",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 14,
              opacity: 0.6,
            }}
          >
            <option>EUR (€)</option>
          </select>
        </section>

        {/* Impressora */}
        <section>
          <h3 style={{ color: "var(--text-primary)", marginBottom: 8 }}>
            🖨️ Impressora
          </h3>
          <div
            style={{
              background: "var(--surface-elevated, #1a1a1a)",
              border: "1px solid var(--border-subtle, #333)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#666",
                  display: "inline-block",
                }}
              />
              Nenhuma impressora configurada
            </div>
            <p
              style={{
                color: "var(--text-tertiary, #666)",
                fontSize: 12,
                marginTop: 8,
              }}
            >
              Em breve: configuração de impressoras térmicas (cozinha, bar,
              caixa).
            </p>
          </div>
        </section>

        {/* Comportamento de fecho */}
        <section>
          <h3 style={{ color: "var(--text-primary)", marginBottom: 8 }}>
            🔒 Fecho de turno
          </h3>
          <div
            style={{
              background: "var(--surface-elevated, #1a1a1a)",
              border: "1px solid var(--border-subtle, #333)",
              borderRadius: 8,
              padding: 16,
              color: "var(--text-secondary)",
            }}
          >
            <p style={{ fontSize: 14 }}>
              Limpeza automática de KDS ao fechar turno:{" "}
              <strong style={{ color: "var(--text-primary)" }}>Ativo</strong>
            </p>
            <p
              style={{
                color: "var(--text-tertiary, #666)",
                fontSize: 12,
                marginTop: 8,
              }}
            >
              Em breve: configuração de políticas de expiração e cleanup.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
