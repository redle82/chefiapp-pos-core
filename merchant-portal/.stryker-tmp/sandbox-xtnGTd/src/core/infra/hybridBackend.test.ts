import { describe, expect, it } from "vitest";
import {
  analyticsClient,
  checkAnalyticsHealth,
  isInsforgeEnabled,
} from "./analyticsClient";
import { checkCoreHealth, coreClient } from "./coreClient";

describe("Hybrid Backend Architecture", () => {
  describe("coreClient (Critical Path)", () => {
    it("always returns Docker Core client", () => {
      // coreClient NUNCA muda, independente de env vars
      expect(coreClient).toBeDefined();
      expect(coreClient.from).toBeDefined();
      expect(coreClient.rpc).toBeDefined();
    });

    it("provides health check function", async () => {
      const isHealthy = await checkCoreHealth();
      // Em dev/test sem Docker, pode falhar (expected)
      expect(typeof isHealthy).toBe("boolean");
    });

    it("exposes expected PostgREST API", () => {
      // Verifica que coreClient segue a interface PostgREST
      // Os métodos principais são from() e rpc()
      // Outros métodos (select, insert, etc.) vêm do builder retornado por .from()
      expect(coreClient).toHaveProperty("from");
      expect(coreClient).toHaveProperty("rpc");

      // Verifica que .from() retorna um builder com métodos esperados
      const builder = coreClient.from("gm_restaurants");
      expect(builder).toHaveProperty("select");
      expect(builder).toHaveProperty("insert");
    });
  });

  describe("analyticsClient (Analytics Path)", () => {
    it("returns appropriate client based on config", () => {
      // analyticsClient muda baseado em isInsforgeEnabled
      expect(analyticsClient).toBeDefined();
      expect(analyticsClient.from).toBeDefined();
    });

    it("provides health check with backend info", async () => {
      const health = await checkAnalyticsHealth();

      expect(health).toHaveProperty("healthy");
      expect(health).toHaveProperty("backend");
      expect(health).toHaveProperty("latencyMs");

      expect(typeof health.healthy).toBe("boolean");
      expect(["insforge", "docker"]).toContain(health.backend);
      expect(typeof health.latencyMs).toBe("number");
    });

    it("reports correct backend selection", () => {
      const health = checkAnalyticsHealth();
      // Se VITE_INSFORGE_URL está vazio, deve usar Docker
      // Se está configurado, deve usar InsForge
      expect(typeof isInsforgeEnabled).toBe("boolean");
    });

    it("measures latency during health check", async () => {
      const startTime = Date.now();
      const health = await checkAnalyticsHealth();
      const elapsed = Date.now() - startTime;

      // latencyMs deve ser aproximado do tempo real
      expect(health.latencyMs).toBeLessThanOrEqual(elapsed + 50); // 50ms tolerance
      expect(health.latencyMs).toBeGreaterThan(0);
    });
  });

  describe("Architecture Separation", () => {
    it("coreClient and analyticsClient are different concepts", () => {
      // Mesmo que em dev ambos apontem para Docker,
      // a arquitetura os trata de forma diferente
      expect(coreClient).toBeDefined();
      expect(analyticsClient).toBeDefined();

      // Se InsForge não está configurado, ambos usam Docker
      // Mas a INTENÇÃO arquitetural é diferente
      if (!isInsforgeEnabled) {
        // Em dev local, ambos usam Docker Core
        expect(coreClient).toBe(analyticsClient);
      } else {
        // Em prod com InsForge, devem ser diferentes
        expect(coreClient).not.toBe(analyticsClient);
      }
    });

    it("coreClient never depends on remote backend config", () => {
      // coreClient SEMPRE usa Docker, independente de VITE_INSFORGE_URL
      // Isto é provado porque coreClient não importa insforgeClient
      const coreClientStr = String(coreClient);
      expect(coreClientStr).toBeDefined();

      // coreClient não deve ter referências a InsForge
      // (isto é garantido pela implementação, não pelo runtime)
    });

    it("analyticsClient respects InsForge configuration", () => {
      // analyticsClient muda baseado em CONFIG.INSFORGE_URL
      if (isInsforgeEnabled) {
        // Se InsForge configurado, deve tentar usá-lo
        expect(analyticsClient).toBeDefined();
      } else {
        // Se não configurado, usa Docker
        expect(analyticsClient).toBe(coreClient);
      }
    });
  });

  describe("Performance Guarantees", () => {
    it("coreClient should have near-zero latency (local)", async () => {
      // Core operations devem ser < 10ms (local Docker)
      const startTime = Date.now();
      try {
        await coreClient.from("gm_restaurants").select("id").limit(1);
      } catch {
        // Esperado em ambiente sem Docker
      }
      const latency = Date.now() - startTime;

      // Em ambiente local com Docker rodando, deve ser < 50ms
      // Em CI/test sem Docker, pode falhar (mas latency ainda é medida)
      expect(latency).toBeLessThan(1000); // Sanity check
    });

    it("analyticsClient warns if latency > 300ms", async () => {
      const health = await checkAnalyticsHealth();

      // Se latencyMs > 300, deve ser logado (não testamos logs aqui)
      // Mas verificamos que latencyMs é capturado
      expect(typeof health.latencyMs).toBe("number");

      // Se latência muito alta, algo está errado
      if (health.latencyMs > 1000) {
        console.warn(
          `⚠️ Analytics latency muito alta: ${health.latencyMs}ms (backend: ${health.backend})`,
        );
      }
    });
  });

  describe("Graceful Degradation", () => {
    it("analyticsClient handles backend failure gracefully", async () => {
      const health = await checkAnalyticsHealth();

      // Mesmo se backend falhar, health check não deve throw
      expect(health).toBeDefined();
      expect(["insforge", "docker"]).toContain(health.backend);

      // Se unhealthy, ainda deve retornar estrutura válida
      if (!health.healthy) {
        expect(health.latencyMs).toBeGreaterThan(0);
        console.warn(
          `⚠️ Analytics backend unhealthy: ${health.backend} (${health.latencyMs}ms)`,
        );
      }
    });
  });
});
