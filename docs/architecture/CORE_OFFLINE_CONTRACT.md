# Contrato Offline / Modo Degradado — Core

## Lei do sistema

**O Core define o que pode ou não funcionar offline, que fila usar e o que o humano vê. A UI obedece e mostra estado.**

Este documento é contrato formal no Core. Modo degradado (sem rede, fila local, sync) é governado por regras explícitas.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Quem manda

| Papel | Responsabilidade |
|-------|------------------|
| **Core** | Define: o que é permitido offline (leitura vs escrita), fila de operações, política de sync, conflitos. Fonte de verdade quando voltar online. |
| **UI** | Usa mecanismos fornecidos (cache, fila, indicador de rede); mostra estado (online, offline, sincronizando). Não inventa política de conflito nem fila própria. |

---

## 2. O que bloqueia

- O **Core** (ou camada que o implementa) define: que operações bloqueiam sem rede, quais vão para fila, quais mostram erro imediato.
- A **UI** não decide “esconder erro” ou “deixar fazer e ver no que dá” sem regra do Core.

---

## 3. O que mostra ao humano

- Estado de conectividade (online / offline / sincronizando) vem do Core ou de contrato explícito (ex.: navigator.onLine + heartbeat).
- Mensagens (“Sem rede. As alterações serão enviadas quando reconectar.”) são definidas por política do Core, não por copy livre na UI.

---

## 4. Fila e sync

- **Fila** de operações pendentes é governada pelo Core (formato, ordem, retry, conflito).
- **Sync** ao voltar online segue regras do Core (quem ganha, merge, rollback). A UI não inventa resolução de conflitos.

---

## 5. O que a UI não faz

- Não mantém fila de escrita independente do Core.
- Não decide sozinha o que “pode” ou “não pode” sem rede.
- Não mostra estado de conectividade sem fonte definida (Core ou contrato explícito).

---

## 6. Status

**FECHADO** para definição de autoridade. Implementação (service worker, IndexedDB, sync algorithm) pode evoluir; quem manda e quem obedece está definido.
