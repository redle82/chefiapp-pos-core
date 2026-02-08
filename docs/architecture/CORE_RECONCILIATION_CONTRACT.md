# Contrato de Reconciliação — Core

**Propósito:** Define formalmente quem é responsável pela reconciliação financeira e operacional, como é accionada, o que é comparado e como se recupera em caso de divergência. Subordinado a [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md).

**Uso:** Qualquer alteração a jobs de reconciliação, comparação de totais, recuperação de estado financeiro ou filas de reconciliação deve respeitar este contrato.

---

## 1. Âmbito

Este contrato governa:

- Quem executa a reconciliação (Core).
- O que é reconciliado (estado de pagamentos, totais de pedidos, caixa, sessões).
- Como a reconciliação é accionada (job, fila, trigger).
- O que acontece em caso de divergência (correcção, bloqueio, auditoria).
- Quem não pode reconciliar (terminais, UI, BaaS).

Este contrato **não** governa:

- Regras de negócio de pagamento (ex.: split, gateway). Ver [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md).
- Persistência bruta ou isolamento por tenant (Kernel).
- Retenção ou imutabilidade de dados. Ver [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md).

---

## 2. O que governa

| Dimensão | Regra |
|----------|--------|
| **Autoridade** | A reconciliação é executada apenas pelo Core (Docker Core). Nenhum terminal, UI ou sistema externo pode definir "verdade" reconciliada. |
| **Escopo** | Reconciliação cobre: estado de pagamentos por pedido, totais de caixa por sessão, consistência pedido–pagamento, e outros conjuntos de dados definidos pelo Core como reconciliáveis. Pagamentos (gateway vs Core) e caixa (abertura/fecho) estão incluídos. |
| **Accionamento** | O Core define quando a reconciliação corre (job, fila, período, evento). Terminais e UI podem solicitar ou visualizar resultado; não accionam a lógica de reconciliação. |
| **Divergência** | Em caso de divergência, o Core aplica regras definidas (corrigir, marcar para auditoria, bloquear). A verdade final é a que o Core persiste após reconciliação. |
| **Recuperação** | A recuperação de estado após falha ou atraso é responsabilidade do Core. Nenhum terminal pode "auto-reconciliar" ou sobrescrever estado reconciliado. |

---

## 3. O que não governa

- Criação ou captura de pagamentos (contratos de billing e pagamentos).
- Abertura ou fecho de caixa (comportamento TPV e RPCs de caixa).
- Design da UI de relatórios ou export (Design System, OUC).

---

## 4. Quem obedece

- **Core (Docker):** executa jobs de reconciliação; mantém filas e resultados; expõe estado reconciliado via API.
- **Terminais e UI:** consomem estado reconciliado; não executam reconciliação; não persistem "versão reconciliada" localmente como verdade.
- **Kernel:** executa persistência e transacções solicitadas pelo Core; não define regras de reconciliação.

---

## 5. Proibição de bypass

É proibido:

- Executar lógica de reconciliação fora do Core (em cliente, BaaS ou outro serviço).
- Permitir que um terminal ou UI altere estado já reconciliado pelo Core.
- Tratar qualquer fonte que não o Core como "verdade reconciliada" para fins financeiros ou operacionais.
- Omitir reconciliação para conjuntos de dados definidos pelo Core como reconciliáveis.

---

## 6. Referências

- [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) — Core como fonte de verdade; reconciliação citada.
- [FINANCIAL_CORE_VIOLATION_AUDIT.md](./FINANCIAL_CORE_VIOLATION_AUDIT.md) — Auditoria de violações (reconciliation callers).

---

*Contrato de reconciliação. Alterações que movam reconciliação para fora do Core ou que permitam terminais/UI alterar verdade reconciliada violam este contrato.*
