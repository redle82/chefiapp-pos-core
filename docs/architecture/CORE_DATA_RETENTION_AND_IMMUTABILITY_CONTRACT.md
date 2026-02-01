# Contrato de Retenção e Imutabilidade de Dados — Core

**Propósito:** Define formalmente o que o Core retém, durante quanto tempo, e o que é imutável após escrita. Dados financeiros e de auditoria têm regras de retenção e imutabilidade; o Core é a autoridade. Subordinado a [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md).

**Uso:** Qualquer alteração a políticas de retenção, purge, histórico ou imutabilidade de registos financeiros ou de auditoria deve respeitar este contrato.

---

## 1. Âmbito

Este contrato governa:

- Quais dados o Core retém e por quanto tempo (retenção).
- Quais dados, uma vez escritos, não podem ser alterados ou apagados (imutabilidade).
- Quem define e aplica essas regras (Core).
- O que terminais e UI não podem fazer (apagar, alterar ou encurtar retenção de dados governados).

Este contrato **não** governa:

- Conteúdo de pedidos ou pagamentos (outros contratos Core).
- Formato de armazenamento ou esquema (migrações, Kernel).
- Dados que não sejam financeiros ou de auditoria, excepto quando explicitamente incluídos pelo Core.

---

## 2. O que governa

| Dimensão | Regra |
|----------|--------|
| **Autoridade** | O Core define políticas de retenção e imutabilidade para dados financeiros e de auditoria. O Kernel executa persistência e pode aplicar constraints de imutabilidade; não define as políticas. |
| **Retenção** | O Core define por quanto tempo dados (ex.: pedidos, pagamentos, movimentos de caixa, logs de auditoria) são retidos. Após o período, o Core pode arquivar ou purgar conforme política; nenhum terminal ou UI pode purgar independentemente. |
| **Imutabilidade** | Dados definidos pelo Core como imutáveis (ex.: evento de pagamento confirmado, linha de pedido fechada, movimento de caixa) não podem ser alterados nem apagados após escrita. Correções são feitas por eventos compensatórios ou ajustes auditados, não por overwrite. |
| **Auditoria** | Alterações a dados que devam ser auditáveis são registadas pelo Core; o registo de auditoria é ele próprio sujeito a retenção e imutabilidade conforme este contrato. |
| **Terminais e UI** | Nenhum terminal ou UI pode apagar, alterar ou reduzir retenção de dados governados pelo Core. Apenas o Core executa purge ou arquivo conforme política. |

---

## 3. O que não governa

- Dados em cache ou cópia local em terminais (governados por verdade e sincronização: [CORE_TRUTH_HIERARCHY.md](./CORE_TRUTH_HIERARCHY.md)).
- Dados que o Core explicitamente classifica como efémeros ou não sujeitos a retenção/imutabilidade.
- Rede, backup ou infraestrutura de armazenamento (operações).

---

## 4. Quem obedece

- **Core:** aplica políticas de retenção e imutabilidade; executa purge ou arquivo; não altera nem apaga dados imutáveis excepto por mecanismos auditados definidos por contrato.
- **Kernel:** persiste com constraints definidas pelo Core (ex.: imutabilidade de colunas ou tabelas); não define políticas.
- **Terminais e UI:** não apagam nem alteram dados governados; consomem apenas o que o Core expõe; não solicitam purge nem bypass de imutabilidade.

---

## 5. Proibição de bypass

É proibido:

- Permitir que um terminal ou UI apague ou altere dados definidos pelo Core como imutáveis.
- Permitir que qualquer sistema externo (BaaS, terceiro) seja autoridade para retenção ou imutabilidade de dados do Core; apenas o Core o é.
- Reduzir retenção ou quebrar imutabilidade para dados financeiros ou de auditoria sem alterar este contrato e as políticas do Core.
- Omitir registo de auditoria quando uma correção ou ajuste for aplicado a dados que devam ser auditáveis.

---

## 6. Referências

- [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) — Core como fonte de verdade; persistência no Docker Core.
- [CORE_RECONCILIATION_CONTRACT.md](./CORE_RECONCILIATION_CONTRACT.md) — Recuperação e verdade reconciliada; não altera imutabilidade.
- [CORE_TRUTH_HIERARCHY.md](./CORE_TRUTH_HIERARCHY.md) — Camadas de verdade; cache e eventual consistência.

---

*Contrato de retenção e imutabilidade. Alterações que permitam apagar ou alterar dados imutáveis ou que reduzam retenção fora das políticas do Core violam este contrato.*
