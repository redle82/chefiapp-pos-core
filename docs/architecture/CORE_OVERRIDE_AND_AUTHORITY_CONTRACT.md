# Contrato de Override e Autoridade — Core

## Lei do sistema

**Quem pode operar, configurar, suspender regras ou forçar exceções é definido pelo Core. O sistema distingue “quem pode quebrar o sistema” (ex.: dono em emergência) de “quem obedece” (ex.: caixa). A UI não inventa exceções nem bypass sem regra.**

Este documento é contrato formal no Core. Evita que exceções viram hacks, decisões críticas fiquem ambíguas e bugs “necessários” surgem.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Quem manda

| Papel | Responsabilidade |
|-------|------------------|
| **Core** | Define: papéis (owner, manager, staff); o que cada um pode fazer (operar, configurar, suspender regras, forçar exceção); condições para override (ex.: emergência, auditoria). Fonte de verdade de permissões. |
| **UI / Terminais** | Mostra apenas acções permitidas ao papel actual; não expõe “forçar” ou “ignorar” sem regra do Core. Não inventa “modo admin” local. |

---

## 2. Níveis de autoridade

| Nível | Descrição | Exemplo |
|-------|-----------|---------|
| **Operar** | Executar fluxos normais (TPV, KDS, tarefas). | Caixa fecha mesa; cozinha marca item pronto. |
| **Configurar** | Alterar parâmetros (horários, menu, limites). Conforme [CHEFIAPP_ROLE_SYSTEM_SPEC.md](../CHEFIAPP_ROLE_SYSTEM_SPEC.md) e contratos de domínio. | Gerente altera horário de abertura. |
| **Suspender regras** | Desactivar temporariamente uma regra (ex.: “aceitar pedido fora de horário”). Requer justificação e, se aplicável, auditoria. | Dono suspende regra em emergência. |
| **Forçar exceção** | Acção que viola regra normal (ex.: desconto acima do limite, reabrir conta fechada). Só quem o Core permitir; com registo. | Override com motivo e papel. |

A **UI** não oferece botão “ignorar” ou “forçar” sem o Core expor a acção e o papel ter permissão.

---

## 3. O que a UI não faz

- Não permite bypass de regra (ex.: fechar conta sem validar) “porque o utilizador é dono” sem o Core definir essa exceção e o fluxo (ex.: override com motivo).
- Não inventa “modo emergência” ou “modo admin” sem contrato ou Core.
- Não esconde acções de override; quando existirem, devem ser auditáveis (Core regista).

---

## 4. Relação com outros contratos

- **Papéis:** [CHEFIAPP_ROLE_SYSTEM_SPEC.md](../CHEFIAPP_ROLE_SYSTEM_SPEC.md); este contrato complementa com “quem pode quebrar regras” e como.
- **AppStaff / visibilidade financeira:** [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md), [CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md](./CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md); staff vê, não controla; override é exceção governada.

---

## 5. Status

**FECHADO** para definição de níveis de autoridade e quem manda. Implementação (RBAC, audit log) pode evoluir; a lei está definida.
