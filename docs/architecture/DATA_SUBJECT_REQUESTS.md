# Processo de Pedidos do Titular (DSR) — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T50-3 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Definir o processo operacional para pedidos dos titulares de dados (RGPD art. 15–20): acesso, retificação, apagamento, portabilidade. Implementação automatizada = Onda 2.

---

## 1. Âmbito

Este documento descreve **como** o ChefIApp (como processador) apoia o **responsável** (cliente/restaurante) no cumprimento dos direitos do titular (Data Subject Requests — DSR). Não substitui a política de privacidade nem o contrato de processamento; complementa-os como referência operacional e jurídica.

**Público-alvo:** DPO, equipa de suporte, equipa jurídica, auditoria.

---

## 2. Direitos do titular (RGPD)

| Direito | Artigo RGPD | Descrição breve |
|---------|-------------|------------------|
| **Acesso** | Art. 15 | O titular pode obter confirmação de se os seus dados são tratados e uma cópia dos dados pessoais. |
| **Retificação** | Art. 16 | O titular pode exigir a correção de dados inexatos ou incompletos. |
| **Apagamento (“direito a ser esquecido”)** | Art. 17 | O titular pode exigir o apagamento dos dados quando aplicável (ex.: consentimento retirado, dados já não necessários). |
| **Limitação do tratamento** | Art. 18 | O titular pode exigir que o tratamento seja limitado (ex.: enquanto se contesta a exatidão). |
| **Portabilidade** | Art. 20 | O titular pode receber os dados que forneceu, num formato estruturado e de uso comum, e pode transmiti-los a outro responsável. |
| **Oposição** | Art. 21 | O titular pode opor-se ao tratamento baseado em interesse legítimo (com exceções legais). |

---

## 3. Processo operacional (responsável + processador)

### 3.1 Receção do pedido

- O **titular** dirige o pedido ao **responsável** (cliente/restaurante), salvo se o contrato ou a política indicar canal direto ao processador para encaminhamento.
- O **responsável** regista o pedido (data, identificação do titular, tipo de direito) e, se aplicável, verifica a identidade do titular.
- O **responsável** comunica ao ChefIApp (processador) o pedido DSR, com o identificador do titular e o tipo de direito, no prazo interno acordado (ex.: 48 h úteis).

### 3.2 Prazos (RGPD)

- **Prazo legal de resposta ao titular:** No máximo **1 mês** (art. 12(3)) a contar da receção do pedido pelo responsável; prorrogável até 2 meses se necessário, com justificação e comunicação ao titular.
- **Prazo interno processador:** O ChefIApp compromete-se a executar as ações técnicas no prazo definido no DPA/contrato (ex.: 15 dias úteis após pedido validado pelo responsável), de forma a permitir ao responsável cumprir o prazo legal.

### 3.3 Ações por tipo de direito

| Direito | Ação do ChefIApp (processador) | Entregável ao responsável |
|---------|---------------------------------|---------------------------|
| **Acesso** | Extrair todos os dados pessoais do titular associados à conta/tenant do cliente. | Ficheiro (ex.: JSON ou CSV) ou relatório, conforme [EXPORT_FORMATS.md](./EXPORT_FORMATS.md) quando definido. |
| **Retificação** | Aplicar as correções indicadas pelo responsável nos sistemas do ChefIApp (dados editáveis). | Confirmação de alteração; dados imutáveis por política não são alterados (apenas anotação ou processo excecional conforme contrato). |
| **Apagamento** | Remover ou anonimizar os dados pessoais do titular nos sistemas do ChefIApp, salvo retenção legal ou contratual. | Confirmação de apagamento/anonimização e âmbito (ex.: “conta e eventos operacionais”; logs de auditoria conforme política de retenção). |
| **Limitação** | Restringir o tratamento conforme instrução do responsável (ex.: flag “tratamento limitado” para o utilizador). | Confirmação de aplicação da limitação. |
| **Portabilidade** | Fornecer os dados pessoais do titular num formato estruturado e de uso comum (ex.: JSON, CSV). | Ficheiro de export conforme [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md) e [EXPORT_FORMATS.md](./EXPORT_FORMATS.md) quando aplicável. |
| **Oposição** | Avaliar com o responsável; se aplicável, deixar de tratar para as finalidades objeto de oposição (ex.: marketing), salvo motivos legítimos prevalecentes. | Confirmação e âmbito. |

### 3.4 Exceções e restrições

- **Obrigações legais:** Dados que o ChefIApp ou o responsável devam reter por lei (ex.: fiscal, trabalho) não são apagados até ao fim do período legal; o titular pode ser informado dessa restrição.
- **Dados imutáveis:** Conforme [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md), alguns dados (ex.: registos financeiros, auditoria) não são alterados nem apagados; o processo de DSR documenta o âmbito e, se aplicável, anonimização em contexto de auditoria.
- **Pedidos manifestamente infundados ou excessivos:** O responsável pode recusar ou cobrar custo (art. 12(5)); o ChefIApp apoia com a informação necessária, não decide a recusa.

---

## 4. Implementação (Onda 2)

- **Estado atual:** Processo definido no papel; execução manual (extração, apagamento, export) conforme instruções internas.
- **Onda 2:** Automatização do fluxo DSR (portal do responsável ou canal seguro): pedido → validação → extração/apagamento/export → confirmação e registo para auditoria.

### 4.1 Entregas Onda 2 (C1, C3, C4)

- **Registo de pedidos (C3):** Tabela `gm_dsr_requests` (tenant_id, subject_id, request_type, status, requested_at, requested_by, deadline_at, completed_at, notes). RPC `create_dsr_request(p_restaurant_id, p_subject_user_id, p_request_type, p_notes, p_deadline_at)` para registar qualquer tipo de pedido.
- **Acesso / portabilidade (C1):** RPC `get_dsr_access_export(p_restaurant_id, p_subject_user_id)` retorna JSON (schema_version `dsr_access_v1`) com dados do titular: membership, shifts, check_ins. Regista pedido em `gm_dsr_requests` e evento em `gm_audit_logs`. Apenas owner/manager do restaurante.
- **Runbook (C4):** [DSR_RUNBOOK.md](../ops/DSR_RUNBOOK.md) — passos para receber, registar, executar (acesso via RPC; retificação/apagamento/limitação/oposição manual) e responder ao titular.

---

## 5. Registo e prova

- O responsável e o ChefIApp devem manter registo dos pedidos DSR (data, tipo, resultado, prazos) para demonstração de conformidade e auditoria.
- O ChefIApp regista as ações executadas como processador (ex.: “export acesso”, “apagamento conta”) conforme [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) quando implementado.

---

**Referências:** [GDPR_MAPPING.md](./GDPR_MAPPING.md) · [WHAT_WE_DO_NOT_PROCESS.md](./WHAT_WE_DO_NOT_PROCESS.md) · [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md) · [EXPORT_FORMATS.md](./EXPORT_FORMATS.md) · [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
