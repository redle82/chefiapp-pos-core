# Contrato de Evolução e Compatibilidade — Core

## Lei do sistema

**O sistema muda sem quebrar clientes. O Core define compatibilidade de versões, comportamento legado, feature flags governadas e “modo antigo” vs “modo novo”. A UI e os clientes não assumem que “a última versão” é a única; o Core governa transições.**

Este documento é contrato formal no Core. Evita medo de mudar, dívidas acumuladas e upgrades que quebram clientes.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Quem manda

| Papel | Responsabilidade |
|-------|------------------|
| **Core** | Define: versão mínima suportada, comportamento legado (ex.: API v1 vs v2), feature flags (quem vê o quê), política de depreciação e sunset. Fonte de verdade para “modo antigo” vs “modo novo”. |
| **UI / Clientes** | Consomem API/contratos conforme versão acordada; não assumem campos ou comportamentos não contratados; respeitam depreciação quando comunicada. |

---

## 2. Compatibilidade

| Aspecto | Descrição |
|---------|-----------|
| **Versão mínima** | Clientes/UI abaixo da versão mínima são considerados não suportados; o Core pode rejeitar ou degradar. |
| **Comportamento legado** | Endpoints ou comportamentos marcados como legado mantêm-se até sunset; não mudam sem aviso e período de transição. |
| **Feature flags** | Novas funcionalidades podem ser expostas por flag (por tenant, papel ou config); o Core decide quem vê o quê. A UI não inventa “feature nova” visível para todos sem regra. |
| **Modo antigo vs novo** | Transição (ex.: “novo TPV”) é governada: quem está em modo antigo, quem em novo, quando o antigo deixa de estar disponível. |

---

## 3. O que a UI não faz

- Não assume que “sempre existe campo X” sem verificar contrato/versão quando a evolução puder ter removido ou alterado X.
- Não ignora avisos de depreciação (ex.: log ou mensagem “API v1 será descontinuada em DD/MM”); migração é responsabilidade do cliente/UI dentro do prazo.
- Não activa “modo novo” por conta própria sem Core ou config governada.

---

## 4. Relação com outros contratos

- **Banco / migrações:** [DATABASE_AUTHORITY.md](./DATABASE_AUTHORITY.md); migrações de schema seguem autoridade; compatibilidade de dados é parte da evolução.
- **Falha:** [CORE_FAILURE_MODEL.md](./CORE_FAILURE_MODEL.md); versão descontinuada ou incompatível pode ser tratada como degradação ou bloqueio conforme Core.

---

## 5. Status

**FECHADO** para definição de quem manda e princípios de compatibilidade e evolução. Implementação (versioning de API, flags, sunset) pode evoluir; a lei está definida.
