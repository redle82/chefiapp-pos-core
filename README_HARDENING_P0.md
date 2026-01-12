# 🛡️ Hardening P0: Documentação Central

Este diretório centraliza toda a documentação referente ao ciclo **Hardening P0** (v0.9.2), focado em estabilidade, conformidade fiscal e robustez offline.

## 🚀 Ação Imediata Necessária

Se você acabou de fazer deploy ou merge da `main`:

> [!IMPORTANT]
> **APLIQUE AS MIGRATIONS AGORA.**
> O código atual (v0.9.2) depende de colunas e funções criadas nestes scripts.
> 👉 **[Clique aqui para ir para o Guia de Migração](./APLICAR_MIGRATIONS_AGORA.md)**

---

## 📚 Índice de Documentação

### 1. Visão Estratégica
*   **[Resumo Executivo (Status Report)](./HARDENING_P0_RESUMO_EXECUTIVO.md)**
    *   O que foi entregue.
    *   Métricas de impacto.
    *   Análise de riscos.

### 2. Execução Técnica
*   **[Guia de Migração SQL](./APLICAR_MIGRATIONS_AGORA.md)** 🚨
    *   Scripts prontos para execução.
    *   Ordem correta de aplicação.
    *   Validação pós-migration.

*   **[Checklist Pós-Migração](./POS_MIGRATION_CHECKLIST.md)** ✅
    *   O que fazer após aplicar migrations.
    *   Testes de sanidade passo a passo.
    *   Validação completa do sistema.

### 3. Garantia de Qualidade (QA)
*   **[Validação Automática](./VALIDACAO_AUTOMATICA.md)** ⚡
    *   Scripts SQL e Bash para validação rápida.
    *   Verificação automática de todas as migrations.

*   **[Roteiro de Validação (Checklist)](./VALIDACAO_HARDENING_P0.md)**
    *   Passos para validar o release.
    *   Testes de sanidade.

*   **Testes Manuais Específicos:**
    *   🧾 [Fiscal & InvoiceXpress](./tests/manual/fiscal-invoicexpress-test.md)
    *   📡 [Offline Sync & Idempotência](./tests/manual/offline-idempotency-test.md)
    *   🏎️ [Race Conditions (Concorrência)](./tests/manual/race-conditions-test.md)
    *   🏭 [Cenários de Produção](./tests/manual/production-test-scenarios.md)

---

## 🆘 Troubleshooting Rápido

**Erro:** `column "sync_metadata" does not exist`
**Solução:** Aplique as migrations de 20260118 (Offline Core).

**Erro:** `relation "integration_orders" does not exist`
**Solução:** Aplique as migrations de 20260117 (Delivery Integration).

**Erro:** `Failed to fetch` (em modo offline)
**Solução:** Comportamento esperado. Verifique se o `OrderEngineOffline` capturou o erro e enfileirou o pedido.

**Erro:** `function check_open_orders_with_lock does not exist`
**Solução:** Aplique a migration 5 (Cash Register Lock) do guia de migração.

---

> **Status do Release:** 🟢 **PRONTO PARA HOMOLOGAÇÃO**
> **Versão:** v0.9.2
