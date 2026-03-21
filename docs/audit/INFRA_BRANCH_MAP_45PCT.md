# Infra Branch Map — Meta 45% src/infra

**Objetivo:** +60 branches em merchant-portal/src/core/infra.

---

## Estado base (após dockerCoreFetchClient sprint)

| Ficheiro | Uncovered | Total | % |
|----------|-----------+-------+---|
| validateInsforgeSetup | ~10 | 52 | 80% |
| eventBus | ~20 | 34 | 41% |
| backendAdapter | ~11 | 47 | 77% |
| coreRpc | 0 | 13 | 100% |

**coreRpc** já está 100% — não requer testes.

---

## eventBus — Branches atacáveis

| Linhas | Código | Branches |
|--------|--------|----------|
| 71-77 | !isCognitiveLayerEnabled + ENABLE_EVENT_LOGGING | 2 |
| 80-86 | !isFeatureEnabled(EVENT_BUS) + ENABLE_EVENT_LOGGING | 2 |
| 91 | publishAsync.catch | 1 |
| 114-118 | ENABLE_EVENT_LOGGING success log | 1 |
| 127-134 | catch + ENABLE_EVENT_LOGGING warn | 1 |
| 137-146 | metadata.retryable + attempt < MAX + ENABLE_EVENT_RETRY | 3 |
| 150-152 | ENABLE_DEAD_LETTER_QUEUE | 1 |
| 199-202 | deadLetterQueue.length > 1000 | 2 |
| 259-266 | ENABLE_EVENT_METRICS + latencies.length > 100 | 2 |
| 287-298 | healthCheck: !cognitiveLayer → true; try/catch | 2 |

**Testes ROI:** retry path, dead letter on failure, queue > 1000, healthCheck catch, ENABLE_EVENT_LOGGING branches.

---

## backendAdapter — Branches atacáveis

| Linhas | Código | Branches |
|--------|--------|----------|
| 26-39 | getRawBaseUrl: import.meta vs process.env (4 condicionais) | 4 |
| 43-52 | getUrl: !url → isProd ? "" : "/rest"; replace | 3 |
| 62-75 | getBackendHealthCheckBaseUrl: docker+window vs url localhost | 2 |
| 93-106 | getBackendType: /rest, DOCKER_INDICATORS, window+url, url? | 4 |

**Testes ROI:** vi.doMock config ou process.env para forçar getRawBaseUrl branches; VITE_CORE_URL com localhost:3001; NODE_ENV production sem URL.

---

## validateInsforgeSetup — Branches restantes

Ver VALIDATE_INSFORGE_SETUP_BRANCH_MAP.md e TEST_SKELETON.md.

---

## Plano de execução

1. **Bloco 1:** validateInsforgeSetup (6 testes) + eventBus (6 testes) → ~25–30 branches
2. **Bloco 2:** backendAdapter (4–5 testes) → ~10–15 branches
3. **Medição:** coverage focado, delta por ficheiro
