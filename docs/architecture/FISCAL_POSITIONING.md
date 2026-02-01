# Posicionamento Fiscal — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T50-4 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Documento canónico que explicita o posicionamento do ChefIApp face à normativa fiscal espanhola (RD 1007/2023, AEAT) e à obrigação de conservação de dados com valor probatório. Não constitui assessoria fiscal; serve de referência para produto, vendas e conformidade.

---

## 1. Âmbito

Este documento descreve:

- O **enquadramento normativo** relevante (Espanha: RD 1007/2023, obrigações perante AEAT).
- O que o **ChefIApp não é** em termos fiscais (não substitui o TPV fiscal nem a contabilidade do restaurante).
- O que o **ChefIApp oferece** em termos de registo operacional e de suporte à prova (dados que podem ser usados pelo cliente para cumprir obrigações).
- **Limites de responsabilidade:** o cliente é responsável pelo cumprimento fiscal; o ChefIApp fornece a plataforma e os dados conforme contrato.

**Público-alvo:** Equipa jurídica, comercial, produto, clientes em contexto espanhol (e equivalente noutros países quando aplicável).

---

## 2. Enquadramento normativo (Espanha)

### 2.1 Real Decreto 1007/2023 (registos de faturação)

- O RD 1007/2023 regula os **registos de faturação** e obrigações de conservação e comunicação à AEAT (Agência Tributária).
- Os sujeitos passivos devem manter registos de faturas emitidas e recebidas e, em certas condições, comunicá-los à AEAT.
- **Equipamentos e sistemas** que emitem ou registam faturas/transações com relevância fiscal devem cumprir requisitos de integridade, sequência e conservação.

### 2.2 O ChefIApp e o TPV fiscal

- O **ChefIApp não é um TPV fiscal** nem um sistema de faturação primário. Orquestra operações de restaurante (KDS, tarefas, turnos, pedidos); **não emite faturas nem substitui o TPV** que o cliente utiliza para cobrança e conformidade fiscal.
- O **TPV fiscal** (ou sistema de faturação) é da responsabilidade do cliente; a integração com TPV externo, quando existir, é documentada nos contratos de integração.
- O ChefIApp pode registar **referências a transações** (ex.: identificador de venda, valor, estado) para operação e reconciliação; **não processa dados de cartão** nem substitui o registo oficial de vendas para efeitos fiscais.

### 2.3 Conservação e valor probatório

- O ChefIApp mantém **registos operacionais** (pedidos, turnos, eventos) conforme [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md). Estes podem ser úteis para o cliente como **prova auxiliar** (ex.: atividade, horários, volume de operações), mas **não substituem** os livros e registos fiscais obrigatórios.
- A **retenção** e o **formato de export** (ex.: work log, dados para auditoria) estão definidos em [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md) e [EXPORT_FORMATS.md](./EXPORT_FORMATS.md); o cliente pode usar esses exports no âmbito das suas obrigações legais, sob sua responsabilidade.

---

## 3. Posicionamento resumido

| Aspeto | Posicionamento |
|--------|-----------------|
| **TPV / Faturação** | O ChefIApp não é TPV fiscal nem emite faturas; o cliente usa o seu TPV/sistema de faturação para conformidade RD 1007/2023 e AEAT. |
| **Registos operacionais** | O ChefIApp mantém registos operacionais (pedidos, turnos, eventos) com retenção e imutabilidade definidas pelo Core; o cliente pode utilizá-los como suporte à prova, dentro do âmbito contratual. |
| **Export e auditoria** | Exports (work log, dados operacionais) são fornecidos conforme especificações; o cliente é responsável pelo uso que lhes dá em contexto fiscal e laboral. |
| **Responsabilidade** | O cliente é responsável pelo cumprimento das obrigações fiscais e perante a AEAT; o ChefIApp fornece a plataforma e os dados conforme contrato e documentação. |

---

## 4. Outros países

- Para **Portugal** ou outros mercados, o posicionamento análogo aplica-se: o ChefIApp não substitui o sistema de faturação/TPV fiscal; fornece registos operacionais e exports conforme especificações; o cliente é responsável pelo cumprimento local.
- Detalhes específicos por país (ex.: obrigações de comunicação a autoridades) devem ser tratados com jurídico e documentados em anexos ou contratos por mercado.

---

## 5. Revisão

- Este documento deve ser revisto com assessoria fiscal/jurídica antes de uso em contexto comercial ou regulatório.
- Alterações à oferta (ex.: novo tipo de export com finalidade fiscal) devem ser refletidas aqui e nos documentos de export e retenção.

---

**Referências:** [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md) · [EXPORT_FORMATS.md](./EXPORT_FORMATS.md) · [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) · [WHAT_WE_DO_NOT_PROCESS.md](./WHAT_WE_DO_NOT_PROCESS.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
