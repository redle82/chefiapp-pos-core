# validateInsforgeSetup — Esqueleto dos 6 Testes

**Padrão:** Seguir `backendClient.test.ts` — `vi.resetModules()` + `vi.doMock` + dynamic import.

---

## Setup compartilhado

```ts
async function setupWithConfig(insforgeUrl: string, anonKey: string) {
  vi.resetModules();
  vi.doMock("../../config", () => ({
    CONFIG: {
      INSFORGE_URL: insforgeUrl,
      INSFORGE_ANON_KEY: anonKey,
    },
  }));
  // backendClient e insforgeClient serão carregados com CONFIG mockado
  const mod = await import("./validateInsforgeSetup");
  return mod.validateInsforgeSetup();
}
```

**Alternativa (mais controlo):** Mockar `./backendClient` directamente para isInsforge, checkBackendHealth, backendClient — evita dependência da cadeia config→insforge.

---

## 1️⃣ CONFIG pass baseline

```ts
it("returns pass for steps 1-2 when INSFORGE_URL and ANON_KEY configured", async () => {
  vi.resetModules();
  vi.doMock("../../config", () => ({
    CONFIG: {
      INSFORGE_URL: "https://xxx.supabase.co",
      INSFORGE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    },
  }));
  const { validateInsforgeSetup } = await import("./validateInsforgeSetup");
  const results = await validateInsforgeSetup();

  const urlCheck = results.find((r) => r.step.includes("INSFORGE_URL"));
  const keyCheck = results.find((r) => r.step.includes("INSFORGE_ANON_KEY"));
  expect(urlCheck?.status).toBe("pass");
  expect(keyCheck?.status).toBe("pass");
});
```

---

## 2️⃣ isInsforge=true happy path (Step 5 + 6)

**Estratégia:** Mockar `./backendClient` directamente — evita a cadeia config→insforge→createClient.

```ts
it("runs Step 5 and 6 when isInsforge true", async () => {
  vi.resetModules();
  vi.doMock("../../config", () => ({
    CONFIG: {
      INSFORGE_URL: "https://xxx.supabase.co",
      INSFORGE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    },
  }));
  vi.doMock("./backendClient", () => ({
    isInsforge: true,
    isDockerCore: false,
    checkBackendHealth: vi.fn().mockResolvedValue(true),
    backendClient: {
      from: () => ({
        select: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    },
  }));
  vi.doMock("./insforgeClient", () => ({
    insforge: {
      database: {},
      auth: {},
      storage: {},
    },
  }));
  const { validateInsforgeSetup } = await import("./validateInsforgeSetup");
  const results = await validateInsforgeSetup();

  const step5 = results.find((r) => r.step.includes("5."));
  const step6 = results.find((r) => r.step.includes("6."));
  expect(step5?.status).toBe("pass");
  expect(step6?.status).toBe("pass");
});
```

---

## 3️⃣ Step 4 catch (insforge throw)

**Nota:** Usar `CONFIG.INSFORGE_URL = ""` para backendClient não aceder a insforge no load; o throw acontece só no try de validateInsforgeSetup.

```ts
it("returns fail for Step 4 when insforge.database access throws", async () => {
  vi.resetModules();
  vi.doMock("../../config", () => ({
    CONFIG: { INSFORGE_URL: "", INSFORGE_ANON_KEY: "" },
  }));
  vi.doMock("./insforgeClient", () => ({
    insforge: {
      get database() {
        throw new Error("init failed");
      },
      auth: {},
      storage: {},
    },
  }));
  const { validateInsforgeSetup } = await import("./validateInsforgeSetup");
  const results = await validateInsforgeSetup();

  const step4 = results.find((r) => r.step.includes("4."));
  expect(step4?.status).toBe("fail");
});
```

---

## 4️⃣ Step 5 health fail

```ts
it("returns fail for Step 5 when checkBackendHealth returns false", async () => {
  vi.resetModules();
  vi.doMock("../../config", () => ({
    CONFIG: { INSFORGE_URL: "https://x.co", INSFORGE_ANON_KEY: "k" },
  }));
  vi.doMock("./backendClient", () => ({
    isInsforge: true,
    isDockerCore: false,
    checkBackendHealth: vi.fn().mockResolvedValue(false),
    backendClient: { from: () => ({ select: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }) },
  }));
  vi.doMock("./insforgeClient", () => ({
    insforge: { database: {}, auth: {}, storage: {} },
  }));
  const { validateInsforgeSetup } = await import("./validateInsforgeSetup");
  const results = await validateInsforgeSetup();

  const step5 = results.find((r) => r.step.includes("5."));
  expect(step5?.status).toBe("fail");
});
```

---

## 5️⃣ Step 6 query error

```ts
it("returns fail for Step 6 when backendClient query returns error", async () => {
  vi.resetModules();
  vi.doMock("../../config", () => ({
    CONFIG: { INSFORGE_URL: "https://x.co", INSFORGE_ANON_KEY: "k" },
  }));
  vi.doMock("./backendClient", () => ({
    isInsforge: true,
    isDockerCore: false,
    checkBackendHealth: vi.fn().mockResolvedValue(true),
    backendClient: {
      from: () => ({
        select: () => ({
          limit: () => Promise.resolve({ data: null, error: { message: "Connection refused" } }),
        }),
      }),
    },
  }));
  vi.doMock("./insforgeClient", () => ({
    insforge: { database: {}, auth: {}, storage: {} },
  }));
  const { validateInsforgeSetup } = await import("./validateInsforgeSetup");
  const results = await validateInsforgeSetup();

  const step6 = results.find((r) => r.step.includes("6."));
  expect(step6?.status).toBe("fail");
});
```

---

## 6️⃣ printValidationResults dual branch

```ts
it("printValidationResults warns when fail>0", () => {
  const results = [
    { step: "1", status: "fail" as const, message: "Failed" },
    { step: "2", status: "pass" as const, message: "OK" },
  ];
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

  printValidationResults(results);

  expect(warnSpy).toHaveBeenCalled();
  expect(infoSpy).not.toHaveBeenCalled();
  warnSpy.mockRestore();
  infoSpy.mockRestore();
});

it("printValidationResults infos when warning>0 and pass===0", () => {
  const results = [
    { step: "1", status: "warning" as const, message: "Not configured" },
  ];
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  printValidationResults(results);

  expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("Docker Core"));
  warnSpy.mockRestore();
  infoSpy.mockRestore();
});
```

---

## Notas de implementação

1. **backendClient** importa `checkInsforgeHealth` de insforgeClient. O `checkBackendHealth` de backendClient chama `checkInsforgeHealth()` quando `isInsforge`. Por isso o mock de `insforgeClient` deve exportar `checkInsforgeHealth` se for usado por `backendClient`. Confirmar em `backendClient.ts`: importa `checkInsforgeHealth` e usa-o em `checkBackendHealth`.

2. **Ordem de mocks:** `vi.doMock` é hoisted. Colocar todos os `vi.doMock` no topo do `it` ou num `beforeEach` com `vi.resetModules()`.

3. **afterEach:** `vi.resetModules()` + `vi.clearAllMocks()` para evitar poluir testes seguintes.

4. **Teste 3 (Step 4 catch):** O getter `insforge` que faz throw deve ser definido de forma a que o acesso a `insforge.database` (em validateInsforgeSetup, via backendClient/insforgeClient) dispare o erro. Se mockarmos `backendClient`, o Step 4 usa `insforge` de insforgeClient directamente (linha 63). Logo o mock de insforgeClient com getter que throw é o caminho certo.
