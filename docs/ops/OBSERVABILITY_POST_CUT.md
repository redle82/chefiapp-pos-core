# Observabilidade mínima pós-corte

**Propósito:** Saber "o sistema está vivo ou mentindo?" sem redesign. Logs reduzidos mas estáveis; só o suficiente para detectar falhas e regressões.

**Contexto:** [Ritual Corte Cirúrgico Freeze](../.cursor/plans/ritual_corte_cirúrgico_freeze_acd25e75.plan.md); [FREEZE_EXIT_CRITERIA.md](../plans/FREEZE_EXIT_CRITERIA.md) (critério "Zero spam estrutural").

---

## 1. Eventos a registar (mínimos)

### 1.1 Mudança de estado do Kernel

- **CoreHealth:** UP / DOWN / UNKNOWN (uma vez por mudança, não por poll).
- **OperationalState.terminals:** status (NOT_IMPLEMENTED / INSTALLED / NOT_INSTALLED); canQuery.
- **Preflight:** bloqueio activo (quando muda), não spam por verificação.

**Onde:** CoreHealth singleton ou useCoreHealth; useOperationalKernel (OperationalState). Evitar log em cada render ou poll; apenas em transição de estado.

### 1.2 Mudança de navegação relevante

- **FlowGate:** redirect aplicado (destino final: /app/dashboard vs "/" vs /auth, etc.) — uma vez por decisão, não por re-render.
- **ORE:** redirectFor usado (superfície + motivo + destino) — quando efectivamente redirecciona.

**Onde:** FlowGate (safeNavigate); useOperationalReadiness (redirectFor). Log apenas quando `navigate(to)` é efectivamente chamado.

### 1.3 Instalação ou perda de terminal

- **Ritual /app/install:** dispositivo instalado (TPV/KDS + restaurant_id + device_id).
- **Heartbeat:** terminal deixou de ser recebido para um device (perda de sinal após N segundos); ou terminal voltou (Online).

**Onde:** InstallPage (após sucesso de setInstalledDevice); useTerminals ou heartbeat consumer (quando estado passa de Online → Offline ou Offline → Online). Um log por evento, não por intervalo de polling.

---

## 2. O que não fazer (anti-spam)

- Não fazer log em cada poll de CoreHealth, Preflight ou heartbeat.
- Não fazer log em cada render do FlowGate ou ORE.
- Não repetir "[CoreHealth] Status changed" ou "relation does not exist" em loop.
- Critério (FREEZE_EXIT_CRITERIA): "Zero spam estrutural; apenas eventos reais."

---

## 3. Onde estão os pontos de log (referência)

| Evento | Módulo / ficheiro | Condição de log |
|--------|-------------------|------------------|
| CoreHealth UP/DOWN/UNKNOWN | coreHealthSingleton ou useCoreHealth | Apenas quando estado muda |
| OperationalState.terminals.status | useOperationalKernel | Apenas quando status ou canQuery muda |
| FlowGate redirect | FlowGate.tsx (safeNavigate) | Opcional: log destino quando to === "/app/dashboard" vs "/" (para auditoria soberania) |
| ORE redirect | useOperationalReadiness (redirectFor) | Quando uiDirective === "REDIRECT" e redirectTo é usado |
| Terminal instalado | InstallPage / setInstalledDevice | Após sucesso do ritual |
| Terminal Online/Offline | useTerminals ou heartbeat | Uma vez por transição por device |

---

## 4. Teste de regressão de spam (opcional)

- Critério já referido em FREEZE_EXIT_CRITERIA: "Zero spam estrutural".
- Opcional: teste (manual ou automatizado) que verifica que, numa sessão típica (landing → auth → dashboard → /app/install), não aparece mais do que N logs repetitivos do mesmo tipo (ex.: N ≤ 1 por tipo de evento por minuto).

---

## 5. Integração com o piloto de uso real prolongado

- Antes de cada sessão de uso real no piloto descrito em `docs/ops/USO_REAL_PROLONGADO_PILOTO.md`, executar:
  - `scripts/test_post_drop_local.sh`
  - Garantir que:
    - Docker Core está saudável.
    - Tabelas `gm_%` CORE/OPERATIONAL existem.
    - Tabelas LEGACY específicas continuam ausentes.
    - `npm run test` em `merchant-portal` passa.
    - `/app/dashboard` e `/app/install` respondem com HTTP 200.
- Usar este ficheiro (`OBSERVABILITY_POST_CUT.md`) como referência para:
  - Quais eventos devem gerar log durante o piloto.
  - Como evitar spam estrutural nos logs.

---

Última actualização: Observabilidade mínima pós-corte; eventos e anti-spam.
