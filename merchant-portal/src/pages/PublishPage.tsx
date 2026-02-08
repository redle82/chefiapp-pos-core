/**
 * PublishPage — Publicar restaurante (CAMINHO_DO_CLIENTE)
 *
 * /app/publish — Botão "Publicar restaurante"; isPublished = true.
 * Libera KDS, TPV, presença online, apps operacionais.
 */

import { PublishSection } from "./Onboarding/sections/PublishSection";

export function PublishPage() {
  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, marginBottom: 8 }}>
          Publicar restaurante
        </h1>
        <p style={{ fontSize: 14, color: "#a3a3a3", margin: 0 }}>
          Ative o seu restaurante para usar TPV, KDS e presença online.
        </p>
      </div>
      <PublishSection />
    </div>
  );
}
