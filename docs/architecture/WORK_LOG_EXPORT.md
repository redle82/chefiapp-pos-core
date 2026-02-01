# Especificação de Export de Work Log — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T50-5 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Especificar o âmbito, formato e uso do export de registos de trabalho (work log: turnos, check-in/check-out, tarefas associadas) para conformidade laboral, fiscal e auditoria. Implementação = Onda 2.

---

## 1. Âmbito

Este documento define a **especificação** do export de work log do ChefIApp. Inclui:

- **Scope:** Que dados entram no export (turnos, eventos de presença, tarefas, etc.).
- **Formato:** Formatos suportados (v1: CSV, JSON) e estrutura dos ficheiros.
- **Uso:** Finalidades previstas (compliance laboral, prova, auditoria, DSR); limites de responsabilidade.
- **Quem pode solicitar:** Responsável (cliente) por tenant; critérios de acesso conforme contrato e [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md) quando definido.

**Estado:** Especificação aprovada; **implementação** do fluxo de export (geração, entrega, registo) = Onda 2.

---

## 2. Dados no scope do work log export

| Categoria | Descrição | Exemplos |
|-----------|-----------|----------|
| **Identificação do tenant e período** | Restaurante/location e intervalo temporal do export | tenant_id, location_id, data_início, data_fim |
| **Utilizadores** | Identificadores e dados mínimos dos utilizadores com atividade no período | user_id, nome (ou pseudónimo conforme política), função |
| **Turnos (shifts)** | Registo de turnos planeados e realizados | shift_id, user_id, início, fim, estado (planeado/realizado/cancelado) |
| **Check-in / Check-out** | Eventos de entrada e saída | event_type (check_in, check_out), user_id, timestamp, location_id |
| **Tarefas atribuídas** | Tarefas associadas a utilizadores no período | task_id, user_id, atribuição, conclusão, timestamp |
| **Metadados do export** | Rastreabilidade do próprio export | export_id, requested_at, requested_by, formato, checksum (quando implementado) |

- **Exclusões:** Dados que não entram no work log export (ex.: conteúdo de pedidos, dados de pagamento, logs de auditoria completos) conforme política e [WHAT_WE_DO_NOT_PROCESS.md](./WHAT_WE_DO_NOT_PROCESS.md). Logs de auditoria podem ser objeto de export separado conforme [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md).

---

## 3. Formatos (v1)

Conforme [EXPORT_FORMATS.md](./EXPORT_FORMATS.md) quando consolidado; resumo:

| Formato | Extensão | Estrutura | Uso previsto |
|---------|----------|-----------|--------------|
| **CSV** | .csv | Um ficheiro por categoria (ex.: shifts.csv, check_ins.csv) ou ficheiro único com todas as colunas; encoding UTF-8; separador vírgula | Excel, análise, importação em ferramentas de RH |
| **JSON** | .json | Estrutura hierárquica: tenant, período, arrays por categoria (users, shifts, check_ins, tasks) | Integração, DSR, portabilidade |

- **Versão do export:** Campo ou ficheiro de metadados indica a versão do schema (ex.: work_log_export_v1) para compatibilidade futura.

---

## 4. Uso e finalidades

- **Compliance laboral:** O cliente pode usar o export para demonstrar horários de trabalho, turnos e presenças, dentro do âmbito das leis laborais aplicáveis.
- **Prova e auditoria:** O export pode servir como prova auxiliar em disputas ou auditorias; não substitui registos oficiais quando a lei exigir formato ou sistema específico.
- **DSR (portabilidade):** O export em formato estruturado (JSON) pode ser usado para satisfazer pedidos de portabilidade (RGPD art. 20) no âmbito dos dados de atividade operacional; ver [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md).
- **Fiscal:** O cliente pode usar o export no contexto das suas obrigações fiscais e perante a AEAT como suporte; ver [FISCAL_POSITIONING.md](./FISCAL_POSITIONING.md). O ChefIApp não emite nem valida documentos fiscais.

---

## 5. Acesso e segurança

- O export é solicitado pelo **responsável** (cliente) ou por utilizadores com permissão equivalente (ex.: admin do tenant). O ChefIApp não expõe exports de um tenant a outro (isolamento multi-tenant).
- O pedido de export e a entrega devem ser registados (quem, quando, período exportado) para auditoria; conformidade com [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) quando implementado.
- Entrega: download seguro (ex.: link temporário, canal conforme DPA) ou entrega por canal acordado no contrato.

---

## 6. Implementação (Onda 2)

- **Entregas previstas:** (1) Fluxo de pedido de export (UI ou API) por tenant e período; (2) Geração dos ficheiros CSV/JSON conforme schema; (3) Entrega e registo; (4) Testes e documentação de uso.
- **Critério de sucesso:** Export funcional e testado; utilizável por cliente para compliance e DSR; registo de pedidos para auditoria.

### 6.1 RPC get_work_log_export (v1)

- **Função:** `get_work_log_export(p_restaurant_id UUID, p_from TIMESTAMPTZ, p_to TIMESTAMPTZ)`.
- **Retorno:** JSON conforme [EXPORT_FORMATS.md](./EXPORT_FORMATS.md) (schema_version work_log_v1): `tenant_id`, `period`, `generated_at`, `export_id`, `users`, `shifts`, `check_ins`, `tasks` (v1: tasks = []).
- **Acesso:** Apenas owner ou membro ativo do restaurante. Cada pedido é registado em `gm_audit_logs` (event_type `export_requested`).
- **Uso:** Cliente pode chamar via Supabase client ou REST e gravar o JSON; conversão para CSV pode ser feita no cliente ou por ferramenta. Ver [AUDIT_LOG_QUERY.md](../ops/AUDIT_LOG_QUERY.md) para consulta de auditoria dos pedidos de export. Runbook: [WORK_LOG_EXPORT_RUNBOOK.md](../ops/WORK_LOG_EXPORT_RUNBOOK.md).

---

**Referências:** [EXPORT_FORMATS.md](./EXPORT_FORMATS.md) · [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) · [FISCAL_POSITIONING.md](./FISCAL_POSITIONING.md) · [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) · [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
