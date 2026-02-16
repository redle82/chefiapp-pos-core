# Triagem de TODOs/FIXMEs — merchant-portal

**Data:** 2026-02-13  
**Objetivo:** Classificar TODOs/FIXMEs em "pré-launch" (resolver antes de lançamento) vs "backlog" (melhoria ou integração futura).

---

## Critérios

- **pré-launch:** Acessibilidade (ARIA, labels), tipagem quebrada, props incorretas, fluxo crítico (TPV pagamento, billing) que possa falhar ou confundir o utilizador. Erros que um utilizador final ou auditor encontraria.
- **backlog:** "Integrar com X", "Implementar quando tabela Y existir", stubs de funcionalidade (VisionPage, SimulationPage, Employee/Mentor/KDS placeholder), melhorias de performance ou configuração (proxy Realtime, polling 15s). Não bloqueiam uso básico do produto.

---

## Resumo por área

| Área | Estimativa | Classificação | Notas |
|------|------------|---------------|--------|
| TPV / OrderContext | 2 | pré-launch (1), backlog (1) | Polling 15s = backlog; proxy Realtime = backlog |
| Onboarding IdentitySection | 0 | resolvido | Lógica país→preset (timezone/currency/locale) já em handleChange; comentário TODO removido |
| Health / HealthEngine | 6 | backlog | Tabelas operational_health, human_health, financial_health não existem no Core |
| SystemTreeContext | 3 | backlog | Dados mock; não bloqueia |
| RestaurantRuntimeContext | 1 | backlog | Nota FASE 1→3 |
| Owner (Vision, Simulation, Purchases, Stock) | 17+ | backlog | Integrações e simulações futuras |
| Employee (Home, Tasks, KDS, Operation, Mentor) | 28+ | backlog | Integração com engines; páginas placeholder |
| Manager (Dashboard, Schedule, Reservations, Central, Analysis) | 27+ | backlog | Integração com Core/IA |
| Waiter / People | 2 | backlog | |
| Tasks / TaskDetailCoreTODO | 10+ | backlog | Core TODO = no-op até schema existir |
| Admin (dashboard, closures, promotions, payments) | 5+ | backlog | Discount tracking, integrações |
| Auth devicePairing | 4 | backlog | |
| Schedule / Shifts / Operation hooks | 15+ | backlog | Integrar com gm_shifts |
| Intelligence / GMBridge / Nervous | 7 | backlog | |
| Core (kernel, currency, sync, gate, inventory, fiscal, infra) | 20+ | backlog | Maioria "quando existir" ou melhoria |
| Public store / CartDrawer | 2 | parcial | Nome: input adicionado (checkout usa valor ou "Cliente Web"). Cancelamento: comentário backend (PATCH orders/:id); PublicStorePage verificação = backend. |
| Integrações (Deliveroo, GloriaFood) | 2 | backlog | |
| Componentes (QRCode, SystemTree labels, storage) | 4 | backlog | |

---

## Pré-launch (resolver antes de launch)

- **OrderContextReal.tsx:** "Considerar reduzir para 15s" — backlog (otimização).
- **Onboarding IdentitySection:** Resolvido — lógica já em `handleChange` (país → preset); comentário TODO removido.
- **Public store / CartDrawer:** Nome do cliente: resolvido (input no drawer; checkout usa `customerName.trim() || "Cliente Web"`). Cancelamento: documentado (quando Core expor PATCH orders/:id, chamar no botão); PublicStorePage "verificação real" = backend.

Qualquer TODO que cause erro de tipagem, ARIA inválido ou falha no fluxo de pagamento TPV/billing deve ser tratado como pré-launch e resolvido.

---

## Estado pós-resolução (pré-launch críticos)

- **IdentitySection:** Resolvido (país→preset em handleChange).
- **CartDrawer:** Nome do cliente resolvido (input no drawer); cancelamento documentado (backend futuro).
- **PublicStorePage:** "Verificação real no backend" = backend; não bloqueia fluxo.
- **OrderContextReal / TableContext:** Polling 15s e proxy Realtime = backlog (otimização).
- Os restantes TODOs em Owner/Employee/Manager/Vision/Simulation/KDS/Mentor/Schedule/Central/etc. são **backlog** (Integrar com X, Buscar do Core); não bloqueiam lançamento.

---

## Backlog (não bloqueiam launch)

- Todos os "Integrar com X", "Implementar quando Y existir", "Buscar do Core", "Integrar com Engine".
- Stubs de páginas (Vision, Simulation, Mentor, KDS intelligent, Central, etc.) que não fazem parte do fluxo mínimo vendável (TPV, KDS, turno, relatório).
- HealthEngine, TaskDetailCoreTODO, schedule/shift hooks até o Core expor as tabelas/APIs correspondentes.

---

## Como gerar a lista completa

```bash
cd merchant-portal
grep -rn "TODO\|FIXME" src --include="*.ts" --include="*.tsx" | sort
```

Para resolver pré-launch: procurar por termos como `aria`, `role`, `label`, `type`, `prop` nos ficheiros com TODO e corrigir; e garantir que IdentitySection e fluxo público (se usado) não dependem de lógica por implementar.
