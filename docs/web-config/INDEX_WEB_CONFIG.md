# Índice — Web de Configuração (rotas documentadas)

**Propósito:** Referência única para todas as rotas da Web de Configuração do ChefIApp OS. Cada rota é um contrato: path, guard, SystemState, Core, backend e UI.

**Fonte de verdade do fluxo:** [ROUTES_WEB_VS_OPERATION.md](../implementation/ROUTES_WEB_VS_OPERATION.md) e `merchant-portal/src/core/flow/CoreFlow.ts`.

**Regras fundamentais:**
- Web de configuração: SEMPRE render para dono com `hasOrg`; nunca bloquear por `systemState` nem por billing/dados.
- Operação (TPV/KDS): bloqueada em `systemState === "SETUP"` → redirect `/onboarding/first-product`.
- Trial é real; nada de demo conceitual; sem perfis Dono/Gerente/Staff na web como muletas.

---

## Rotas documentadas

| Rota | Path | Doc | Estado |
|------|------|-----|--------|
| Compras | `/purchases` | [ROTA_COMPRAS.md](ROTA_COMPRAS.md) | UI PARCIAL |
| Financeiro | `/financial` | [ROTA_FINANCEIRO.md](ROTA_FINANCEIRO.md) | UI PARCIAL |
| Reservas | `/reservations` | [ROTA_RESERVAS.md](ROTA_RESERVAS.md) | UI PARCIAL |
| Multi-Unidade | `/groups` | [ROTA_MULTI_UNIDADE.md](ROTA_MULTI_UNIDADE.md) | DOCUMENTADO |
| QR Mesa | Config: `/config` (secção QR); Público: `/public/:slug/mesa/:number` | [ROTA_QR_MESA.md](ROTA_QR_MESA.md) | UI PARCIAL (config) + IMPLEMENTADO (público) |
| Painel Pedidos Prontos | `/op/kds` (operacional) + link no dashboard | [ROTA_PAINEL_PEDIDOS_PRONTOS.md](ROTA_PAINEL_PEDIDOS_PRONTOS.md) | DOCUMENTADO |
| Mentor IA (opcional) | `/mentor` | [ROTA_MENTOR_IA.md](ROTA_MENTOR_IA.md) | UI PARCIAL |
| Presença Online (opcional) | Config: `/config`; Público: `/public/:slug` | [ROTA_PRESENCA_ONLINE.md](ROTA_PRESENCA_ONLINE.md) | IMPLEMENTADO (config + público) |

---

## Estrutura de cada documento

Cada `ROTA_<NOME>.md` contém:

1. **Visão Geral** — O que a rota resolve; para quem (Dono); em que momento do ciclo de vida.
2. **Rota & Acesso** — Path exato; tipo WEB CONFIG; guard (CoreFlow); comportamento por SystemState (SETUP, TRIAL, ACTIVE, SUSPENDED).
3. **Conexão com o Core** — Entidades lidas/escritas (Restaurant, Orders, Payments, Staff, Inventory, Tables); eventos gerados.
4. **Backend & Dados** — Tabelas; RPCs esperadas; backend local; estado vazio honesto.
5. **UI / UX Esperada** — Estados (Vazio, Em uso, Erro); mensagens humanas; CTAs.
6. **Integração com Outras Rotas** — De onde vem; para onde vai; dependências.
7. **Regras de Negócio** — Permitido; bloqueado; regra de ouro.
8. **Estado Atual** — IMPLEMENTADO | UI PARCIAL | BACKEND PENDENTE | DOCUMENTADO; próximo passo técnico.

---

## Referências

- **CoreFlow:** `merchant-portal/src/core/flow/CoreFlow.ts` (`isWebConfigPath`, `isOperationalPath`, `resolveNextRoute`).
- **Mapa rotas:** [ROUTES_WEB_VS_OPERATION.md](../implementation/ROUTES_WEB_VS_OPERATION.md).
- **Declaração pós-refatoração:** [DECLARACAO_POS_REFATORACAO_WEB_V1.md](../DECLARACAO_POS_REFATORACAO_WEB_V1.md).
- **Contratos Core:** [architecture/CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md).

Última atualização: 2026-02-01.
