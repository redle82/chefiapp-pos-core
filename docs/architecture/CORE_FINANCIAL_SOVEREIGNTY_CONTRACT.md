# Contrato de Soberania Financeira — Core (Supreme Contract)

## Lei do sistema

**O ChefIApp Central Core é o FINANCIAL CORE.**

Está fisicamente e logicamente no Docker Core (Postgres + Kernel + Execution Engine). Este Core é a **única fonte de verdade** para estado financeiro, pedidos, totais, estado de pagamentos, reconciliação, decisões de SLA e bloqueio, e autoridade operacional.

**Facto não negociável:** Nenhum BaaS (Supabase, Firebase ou similar) pode ser Core, fonte de verdade ou autoridade. BaaS podem existir apenas como integrações futuras e subordinadas, explicitamente marcadas como não autoritativas.

---

## 1. Docker Core como Core Financeiro Soberano

| Aspecto | Regra |
|--------|--------|
| **Localização** | O Financial Core está no Docker Core: Postgres (dados), Kernel (gatekeeper), Execution Engine (orquestração). |
| **Fonte de verdade** | Estado financeiro, pedidos, totais, estado de pagamentos, reconciliação e decisões de bloqueio/SLA são **apenas** no Core. |
| **Autoridade de execução** | O Core decide. Terminais (Web, AppStaff, KDS, TPV) obedecem e executam acções permitidas. |
| **Proibição explícita** | Supabase, Firebase ou qualquer BaaS **NÃO** podem ser usados como Core. **NÃO** podem ser fonte de verdade. **PODEM** aparecer apenas como integrações futuras e subordinadas (explicitamente não autoritativas). |

---

## 2. Regra da fonte única de verdade

- **Estado financeiro:** definido e persistido pelo Core (Postgres + Kernel).
- **Pedidos e totais:** criados, validados e calculados pelo Core; terminais mostram e submetem acções.
- **Estado de pagamentos:** o Core regista e expõe; nenhum terminal inventa "pago" ou "pendente" localmente.
- **Reconciliação:** o Core compara e reconcilia; nenhuma UI persiste verdade financeira ou operacional.
- **SLA e decisões de bloqueio:** o Core define limites e bloqueia; terminais mostram estado e obedecem.

---

## 3. Autoridade de execução

- **Kernel / Execution Engine** executam no Core. A UI chama; o Core valida e persiste.
- **Nenhum terminal** calcula totais, preços, estado de pagamento ou SLA localmente.
- **Nenhuma UI** persiste verdade financeira ou operacional. A UI consome APIs do Core e mostra estado.

---

## 4. Hierarquia de subordinação

```
Docker Financial Core (Postgres + Kernel + Execution Engine)
  → Kernel / Execution Engine
  → Core Contracts (todos subordinados a este contrato)
  → Terminals (Web, AppStaff, KDS, TPV)
  → Design System (apenas visual; não define regras nem estado)
```

- **Contratos Core** são subordinados ao CORE_FINANCIAL_SOVEREIGNTY_CONTRACT. Nenhuma regra, estado ou execução definida noutro contrato pode sobrepor o Docker Financial Core.
- **Terminais** são subordinados aos contratos Core e ao Core físico. Obedecem ao Kernel e aos readers/writers.
- **Design System** é apenas visual; não define regras de negócio, estado financeiro nem autoridade.

---

## 5. Referências

- [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) — Contrato #0 (Supreme Contract / Root of Authority).
- [CORE_EXECUTION_TOPOLOGY.md](./CORE_EXECUTION_TOPOLOGY.md) — Quem executa o quê; Core decide, UI chama.
- [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md) — Onde a lei está no código.

---

**Frase de sistema maduro:** *O Core financeiro manda. Docker é o soberano. Nenhum BaaS é autoridade.*
