import { beforeEach, describe, expect, it, vi } from "vitest";

describe("featureFlags / featureFlagManager", () => {
  beforeEach(() => {
    vi.resetModules();
    // Limpar env simulado entre testes
    // @ts-expect-error test-only global
    delete global.__VITE_ENV__;
  });

  it("usa defaults seguros quando não há overrides de ambiente", async () => {
    const {
      isCognitiveLayerEnabled,
      isFeatureEnabled,
    } = await import("./featureFlags");

    expect(isCognitiveLayerEnabled()).toBe(false);
    expect(isFeatureEnabled("ENABLE_COGNITIVE_LAYER")).toBe(false);
    expect(isFeatureEnabled("ENABLE_EVENT_BUS")).toBe(false);
    // Operacionais fiáveis vêm ativos por defeito
    expect(isFeatureEnabled("ENABLE_EVENT_RETRY")).toBe(true);
    expect(isFeatureEnabled("ENABLE_DEAD_LETTER_QUEUE")).toBe(true);
  });

  it("lê flags booleanas de __VITE_ENV__ quando definido", async () => {
    vi.stubGlobal("__VITE_ENV__", {
      VITE_ENABLE_COGNITIVE_LAYER: "true",
      VITE_ENABLE_EVENT_BUS: "1",
      VITE_ENABLE_EVENT_RETRY: "false",
    });

    const {
      isCognitiveLayerEnabled,
      isFeatureEnabled,
    } = await import("./featureFlags");

    expect(isCognitiveLayerEnabled()).toBe(true);
    expect(isFeatureEnabled("ENABLE_EVENT_BUS")).toBe(true);
    // Override para falso deve ser respeitado
    expect(isFeatureEnabled("ENABLE_EVENT_RETRY")).toBe(false);
  });

  it("enableCognitiveLayer e disableCognitiveLayer ligam/desligam o conjunto coerente de flags", async () => {
    const {
      enableCognitiveLayer,
      disableCognitiveLayer,
      isCognitiveLayerEnabled,
      isFeatureEnabled,
    } = await import("./featureFlags");

    // Ativa cognitive layer
    enableCognitiveLayer();
    expect(isCognitiveLayerEnabled()).toBe(true);
    expect(isFeatureEnabled("ENABLE_EVENT_BUS")).toBe(true);
    expect(isFeatureEnabled("ENABLE_AI_SUGGESTIONS")).toBe(true);
    expect(isFeatureEnabled("ENABLE_COGNITIVE_ANALYTICS")).toBe(true);

    // Kill switch de emergência deve desligar tudo o que é cognitivo
    disableCognitiveLayer();
    expect(isCognitiveLayerEnabled()).toBe(false);
    expect(isFeatureEnabled("ENABLE_EVENT_BUS")).toBe(false);
    expect(isFeatureEnabled("ENABLE_AI_SUGGESTIONS")).toBe(false);
    expect(isFeatureEnabled("ENABLE_COGNITIVE_ANALYTICS")).toBe(false);
  });
});

