# validateInsforgeSetup — Mapa de Branches e Testes ROI

**Total:** 52 branches, 26 uncovered (50%).  
**Objetivo:** +15–20 branches com 6 testes focados.

---

## 1. Estrutura do ficheiro (linha a linha)

| Linhas | Código | Branches |
|--------|--------|----------|
| 35–40 | CONFIG.INSFORGE_URL ? pass : warning | 2 |
| 36–39 | message A vs B | 2 |
| 44–49 | CONFIG.INSFORGE_ANON_KEY ? pass : warning | 2 |
| 46–48 | slice + message A vs B | 2 |
| 55–58 | isInsforge ? message InsForge : Docker | 2 |
| 62–84 | try { hasDatabase && hasAuth && hasStorage } catch | 2+3 |
| 87–112 | if (!isInsforge) skip else try { checkBackendHealth } catch | 2+2+2 |
| 116–154 | if (!isInsforge) skip else try { backendClient.from } if (error) | 2+2+2 |
| 166–174 | status pass/fail/warning/skip (icon) | 4 |
| 176–178 | if (result.detail) | 2 |
| 197–207 | summary.fail > 0 \|\| (warning > 0 && pass === 0) \|\| else | 3 |
| 221–222 | typeof window !== "undefined" | 2 |

---

## 2. Estado actual dos testes

- 1 teste geral (sem mocks)
- `isInsforge = false` (CONFIG.INSFORGE_URL vazio)
- Caminhos cobertos: warning em 1–2, pass em 3, skip em 5 e 6, pass ou fail em 4
- Caminhos não cobertos: pass em 1–2, isInsforge=true (5 e 6), catch em 4, error em 6, `printValidationResults` com fail/warning-only, `typeof window`

---

## 3. 6 testes com maior ROI

| # | Teste | Branches | Mock | Expectativa |
|---|-------|----------|------|-------------|
| 1 | **INSFORGE_URL + ANON_KEY configurados → pass** | ~4 | CONFIG.INSFORGE_URL + ANON_KEY | steps 1–2 com status "pass" |
| 2 | **isInsforge=true → Step 5 (health) + Step 6 (query)** | ~6 | CONFIG.INSFORGE_URL, checkBackendHealth→true, backendClient→{data:[],error:null} | step 5 pass, step 6 pass |
| 3 | **Step 4 catch (insforge throw)** | ~2 | insforge a lançar ao aceder .database | step 4 status "fail", message "initialization error" |
| 4 | **Step 5 health fail** | ~2 | isInsforge=true, checkBackendHealth→false | step 5 status "fail" |
| 5 | **Step 6 query error** | ~2 | isInsforge=true, backendClient.from().select()→{data:null, error:{message:"..."}} | step 6 status "fail" |
| 6 | **printValidationResults summary branches** | ~3 | results com fail>0; results com warning>0 && pass===0 | console.warn vs console.info conforme summary |

---

## 4. Dependências para mock

```ts
// Para isInsforge=true:
vi.mock("../../config", () => ({
  CONFIG: {
    INSFORGE_URL: "https://xxx.supabase.co",
    INSFORGE_ANON_KEY: "eyJ...",
  },
}));

// backendClient e checkBackendHealth vêm de backendClient
// É preciso mock de backendClient (vi.mock) antes do import de validateInsforgeSetup
```

**Nota:** `isInsforge` e `backendClient` são avaliados ao carregar o módulo. Para testar isInsforge=true, o mock de CONFIG deve estar ativo antes de importar `backendClient` ou `validateInsforgeSetup`. O padrão em `backendClient.test.ts` usa `vi.doMock` + dynamic import.

---

## 5. Projeção realista

| Testes | Branches estimados |
|--------|--------------------|
| 6 focados | 18–22 |
| Conservador | 15–18 |

Custo: 1 sessão (~1–2 h). Ganho global: ~+0,2–0,3 pp.
