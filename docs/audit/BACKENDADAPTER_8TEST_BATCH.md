# backendAdapter — Plano de 8 Testes (ROI Coverage)

**Objetivo:** Cobrir ~12–18 branches em `infra/backendAdapter.ts` com 8 cenários cirúrgicos.

**Branches alvo (coverage-final.json):** L29, L34, L36, L48, L97 (5 grupos; ~12–18 sub-branches).

---

## Mapa exato de branches frios

| ID | Linha | Tipo | Código | Condição |
|----|-------|------|--------|----------|
| 3 | 29 | if | getRawBaseUrl | `import.meta.env?.VITE_SUPABASE_URL` (quando VITE_CORE_URL ausente) |
| 5 | 34 | if | getRawBaseUrl | `process.env?.VITE_CORE_URL` |
| 7 | 36 | if | getRawBaseUrl | `process.env?.VITE_SUPABASE_URL` |
| 12 | 48 | if | getUrl | `!url && isProd` → return "" |
| 20 | 97 | binary-expr | getBackendType | `url.includes(":5175") \|\| url === window.location.origin` |

---

## Cluster 1 — getRawBaseUrl (L29, 34, 36)

**Branches:** import.meta.env.VITE_SUPABASE_URL, process.env.VITE_CORE_URL, process.env.VITE_SUPABASE_URL.

### Teste 1: getRawBaseUrl usa import.meta.env.VITE_SUPABASE_URL quando VITE_CORE_URL ausente

```
vi.stubEnv("VITE_CORE_URL", undefined);
vi.stubEnv("VITE_SUPABASE_URL", "http://supabase.example.com");
vi.resetModules();
const { getBackendConfigured } = await import("./backendAdapter");
Expect: getBackendConfigured() === true (ou getBackendType() === docker).
Branches: L29.
```

### Teste 2: getRawBaseUrl usa process.env quando import.meta vars ausentes

```
vi.stubEnv("VITE_CORE_URL", undefined);
vi.stubEnv("VITE_SUPABASE_URL", undefined);
process.env.VITE_CORE_URL = "http://localhost:3001";
vi.resetModules();
const { getBackendType } = await import("./backendAdapter");
Expect: getBackendType() === BackendType.docker.
Restaurar process.env após teste.
Branches: L34.
```

### Teste 2b: getRawBaseUrl usa process.env.VITE_SUPABASE_URL

```
vi.stubEnv para ambos undefined;
process.env.VITE_CORE_URL = undefined; delete;
process.env.VITE_SUPABASE_URL = "http://localhost:3001";
vi.resetModules(); dynamic import;
Expect: getBackendType() === BackendType.docker.
Branches: L36.
```

---

## Cluster 2 — getUrl (L48)

**Branches:** `!url && isProd` (return ""), `!url && !isProd` (return "/rest").

### Teste 3: getUrl retorna "" quando sem URL e NODE_ENV=production

```
Process.env: NODE_ENV=production, VITE_CORE_URL e VITE_SUPABASE_URL ausentes.
Expect: getUrl() === "" (ou getBackendType() === none).
Já coberto pelo teste existente "returns none/configured=false...". Verificar se L48 isProd está coberto.
Branches: L48 (isProd true).
```

### Teste 4: getUrl retorna "/rest" quando sem URL e NODE_ENV≠production

```
Process.env: NODE_ENV=development, URLs ausentes.
Expect: getUrl() === "/rest", getBackendType() === BackendType.docker.
Branches: L48 (isProd false).
```

---

## Cluster 3 — getBackendType window/origin (L97)

**Branches:** `url.includes(":5175")`, `url === window.location.origin`.

### Teste 5: getBackendType retorna docker quando url contém :5175

```
vi.stubGlobal("window", { location: { origin: "http://localhost:5175" } });
VITE_CORE_URL = "http://localhost:5175" (via process.env ou stubEnv).
Expect: getBackendType() === BackendType.docker.
Branches: L97 (url.includes(":5175")).
```

### Teste 6: getBackendType retorna docker quando url === window.location.origin

```
window.location.origin = "https://app.example.com";
VITE_CORE_URL = "https://app.example.com".
Expect: getBackendType() === BackendType.docker.
Branches: L97 (url === window.location.origin).
```

---

## Cluster 4 — Densidade extra (L92)

**Branches:** `url.includes("/rest")`, `DOCKER_INDICATORS.some`.

### Teste 7: getBackendType retorna docker quando url inclui /rest

```
VITE_CORE_URL = "https://api.example.com/rest".
Expect: getBackendType() === BackendType.docker.
Branches: L92 (url.includes("/rest")).
```

### Teste 8: getBackendType retorna docker para DOCKER_INDICATORS (127.0.0.1:3001)

```
VITE_CORE_URL = "http://127.0.0.1:3001".
Expect: getBackendType() === BackendType.docker.
Branches: L92 (DOCKER_INDICATORS.some).
```

---

## Mapeamento Teste → Linhas

| Teste | Linhas cobertas | Tipo |
|-------|-----------------|------|
| 1 | 29 | if |
| 2 | 34 | if |
| 2b | 36 | if |
| 3 | 48 | if (isProd) |
| 4 | 48 | if (!isProd) |
| 5 | 97 | binary-expr |
| 6 | 97 | binary-expr |
| 7 | 92 | if |
| 8 | 92 | binary-expr |

---

## Ordem de execução recomendada

1. Testes 4, 5, 6, 7, 8 — sem vi.resetModules, process.env direto.
2. Testes 1, 2, 2b — vi.stubEnv + vi.resetModules + dynamic import.

---

## Notas técnicas

- **vi.stubEnv + vi.resetModules:** Necessário para testes que forçam getRawBaseUrl a ler import.meta.env ou process.env em ordem diferente. Após stubEnv, resetModules e dynamic import garantem que o módulo vê o novo env.
- **Restaurar estado:** Sempre restaurar process.env, window e variáveis de ambiente em afterEach ou no final de cada teste.
- **Não alterar código de produção.**
