# Política de Retenção de Dados — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T30-3 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Documento canónico de retenção de dados, consolidando e tornando explícito o que o Core já define em [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md). Referência para DPO, jurídico e operações.

---

## 1. Âmbito

Este documento consolida:

- **O que** é retido e **por quanto tempo** (por categoria de dados).
- **Quem** define e aplica (Core como autoridade).
- **O que não** pode ser feito por terminais ou UI (apagar, alterar ou encurtar retenção de dados governados).
- **Imutabilidade:** Dados que, uma vez escritos, não são alterados nem apagados; correções por evento compensatório ou ajuste auditado.

**Fonte técnica:** [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md). Este doc é a versão canónica para comunicação externa e conformidade.

---

## 2. Autoridade

- **Core** define e aplica políticas de retenção e imutabilidade para dados financeiros e de auditoria.
- **Kernel** executa persistência e pode aplicar constraints (ex.: colunas imutáveis); não define políticas.
- **Terminais e UI** não apagam, alteram nem reduzem retenção de dados governados; apenas o Core executa purge ou arquivo conforme política.

---

## 3. Categorias e retenção

| Categoria | Retenção (mínimo ou referência) | Imutável após escrita? | Nota |
|-----------|---------------------------------|-------------------------|------|
| **Pedidos (ordem, itens, estado)** | Conforme política do Core; não inferior ao necessário para obrigações legais e disputas (ex.: 6–7 anos fiscal) | Sim (eventos de estado; correções por compensação) | Core governa |
| **Pagamentos e movimentos de caixa** | Idem; alinhado a obrigações fiscais e laborais | Sim | Core governa |
| **Logs de auditoria (quem fez o quê, quando)** | Período definido pelo Core; não inferior ao necessário para obrigações legais e disputas (ex.: 2 anos segurança; 7 anos quando fiscal) | Sim | [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) |
| **Dados de conta e identidade (utilizadores, membros)** | Enquanto a conta/contrato existir; após fim de contrato conforme política de purge e obrigações legais (ex.: RGPD) | Não (dados editáveis); histórico de alterações pode ser auditável | Contrato de processamento |
| **Turnos e presença (work log)** | Conforme política do Core e obrigações laborais (ex.: 5 anos) | Sim (eventos check-in/check-out) | Export: [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md) |
| **Configuração do restaurante (menu, integrações)** | Enquanto o tenant existir; histórico de alterações conforme política | Parcial (versões ou eventos de alteração auditáveis) | Core governa |
| **Métricas agregadas e dashboards** | Conforme política interna (ex.: 13 meses para analytics); sem identificação reversível além do necessário | Não | [METRICS_DICTIONARY.md](./METRICS_DICTIONARY.md) |
| **Cache e cópia local em terminais** | Efémero; governado por [CORE_TRUTH_HIERARCHY.md](./CORE_TRUTH_HIERARCHY.md) | Não | Não é retenção persistente do Core |

*Nota:* Prazos concretos (ex.: 6 anos, 7 anos) devem ser confirmados com jurídico/fiscal por jurisdição; a tabela acima é referência.

---

## 4. Imutabilidade

- Dados definidos pelo Core como **imutáveis** (ex.: evento de pagamento confirmado, linha de pedido fechada, movimento de caixa, registo de auditoria) **não podem ser alterados nem apagados** após escrita.
- **Correções:** Feitas por eventos compensatórios ou ajustes auditados, não por overwrite.
- **Purge:** Apenas o Core executa purge ou arquivo, conforme política e fim do período de retenção; nenhum terminal ou UI pode purgar independentemente.

---

## 5. Proibições

- Permitir que terminais ou UI apaguem ou alterem dados imutáveis.
- Permitir que sistema externo (BaaS, terceiro) seja autoridade para retenção ou imutabilidade; apenas o Core o é.
- Reduzir retenção ou quebrar imutabilidade sem alterar este documento e o contrato Core.
- Omitir registo de auditoria quando uma correção ou ajuste for aplicado a dados auditáveis.

---

## 6. Revisão

- Esta política deve ser revista com DPO/jurídico quando houver alteração de obrigações legais ou de arquitetura.
- Alterações à retenção ou imutabilidade devem ser refletidas em [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) e neste documento.

---

**Referências:** [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) · [GDPR_MAPPING.md](./GDPR_MAPPING.md) · [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) · [AUDIT_LOG_PURGE_RUNBOOK.md](../ops/AUDIT_LOG_PURGE_RUNBOOK.md) (purge gm_audit_logs) · [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
