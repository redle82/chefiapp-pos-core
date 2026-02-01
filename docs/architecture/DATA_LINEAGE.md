# Especificação de Data Lineage — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T30-5 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Especificação de lineage (origem, transformação e uso de dados) no ChefIApp. Fase inicial: documentação manual + desenho para futuro pipeline. Pipeline automatizado = Onda 3.

---

## 1. Âmbito

Este documento define:

- **O que é lineage:** Rastreio de onde vêm os dados, como são transformados e onde são usados (ou exportados).
- **Estado atual:** Documentação manual (este doc e contratos); sem pipeline de lineage automatizado.
- **Estado alvo (Onda 3):** Pipeline ou processo que permita consultar origem e fluxo de dados críticos (ex.: pedidos, pagamentos, auditoria, exports).

**Uso:** Conformidade, auditoria e evolução de dados; DPO e equipa técnica.

---

## 2. Princípios

- **Dados críticos:** Pedidos, pagamentos, movimentos de caixa, logs de auditoria, dados pessoais (identidade, turnos, tarefas).
- **Ordem de verdade:** O Core (Docker Core) é a fonte de verdade para estado financeiro e operacional; Supabase/BaaS para auth e dados do Merchant Portal conforme [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md).
- **Tenant:** Todo o fluxo é particionado por tenant (restaurant_id); não há mistura cross-tenant.

---

## 3. Tabelas → fontes → consumidores (H1 Onda 3)

Mapeamento mínimo: origem (quem escreve) e uso (quem lê ou exporta) dos dados críticos.

### 3.0 Pedidos

| Tabela | Fontes (escrita) | Consumidores (leitura / uso) |
|--------|-------------------|------------------------------|
| **gm_orders** | RPC `create_order_atomic` (TPV, AppStaff, API); atualização de estado e pagamento via `process_order_payment` | KDS, terminais (sync); RPC `get_operational_metrics`; `daily_closings`; export work log / DSR (indireto via períodos); auditoria (eventos order_created, payment_recorded) |
| **gm_order_items** | RPC `create_order_atomic` (inserção em lote) | KDS, TPV (estado por item); auditoria |

### 3.0.1 Pagamentos

| Tabela | Fontes (escrita) | Consumidores (leitura / uso) |
|--------|-------------------|------------------------------|
| **gm_payments** | RPC `process_order_payment` (TPV / PSP; sem dados de cartão) | RPC `get_operational_metrics`; reconciliação; auditoria (event_type payment_recorded); relatórios financeiros |

### 3.0.2 Auditoria

| Tabela | Fontes (escrita) | Consumidores (leitura / uso) |
|--------|-------------------|------------------------------|
| **gm_audit_logs** | RPCs: `create_order_atomic` (order_created), `process_order_payment` (payment_recorded), `admin_disable_staff_member` / `admin_reenable_staff_member`, `log_login_failure`, `record_auth_event`; triggers: `turn_sessions` (shift_started, shift_ended), `gm_cash_registers` (cash_register_opened, cash_register_closed); RPCs export: `get_work_log_export`, `get_dsr_access_export` (export_requested). **Delete:** apenas RPC `purge_audit_logs_older_than` (service_role, conforme RETENTION_POLICY). | RPC `get_audit_logs`; RPC `get_operational_metrics` (export_requested_count); subscritores Supabase Realtime (G1); dashboards/agregadores; DPO/auditoria; runbook de purge |

### 3.0.3 Turnos e caixa

| Tabela | Fontes (escrita) | Consumidores (leitura / uso) |
|--------|-------------------|------------------------------|
| **turn_sessions** | RPC `start_turn` (INSERT); trigger em UPDATE status → closed (shift_ended → gm_audit_logs) | RPC `get_operational_metrics` (active_shifts_count); RPCs `get_work_log_export`, `get_dsr_access_export`; daily_closings |
| **gm_cash_registers** | Abertura/fecho de caixa (INSERT/UPDATE) | Triggers que escrevem cash_register_opened / cash_register_closed em gm_audit_logs |

---

## 4. Fluxos principais (documentação manual)

### 4.1 Pedidos

| Etapa | Origem | Transformação / Armazenamento | Destino / Uso |
|-------|--------|-------------------------------|---------------|
| Criação | TPV, AppStaff, Web (GloriaFood) | API Core ou BaaS (conforme contrato); evento order_created | Core (persistência); KDS (vista); auditoria |
| Atualização de estado | KDS, TPV | Evento order_item_status_changed; ordem atualizada | Core; terminais (sync); auditoria |
| Pagamento | TPV / PSP | Evento payment_recorded; referência (sem dados de cartão) | Core; reconciliação; auditoria |
| Export | Responsável (cliente) ou DSR | [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md), [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) | Ficheiro CSV/JSON; cliente ou titular |

### 4.2 Turnos e presença

| Etapa | Origem | Transformação / Armazenamento | Destino / Uso |
|-------|--------|-------------------------------|---------------|
| Check-in / Check-out | AppStaff | Eventos shift_started, shift_ended | Core ou BaaS (gm_*); auditoria; work log export |
| Export work log | Responsável | [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md) | CSV/JSON; compliance laboral, DSR |

### 4.3 Identidade e sessão

| Etapa | Origem | Transformação / Armazenamento | Destino / Uso |
|-------|--------|-------------------------------|---------------|
| Login | Cliente (browser/app) | Supabase Auth; JWT; evento login_success | Merchant Portal; Core (contexto tenant) |
| Membresia | Owner/Manager | gm_restaurant_members; eventos user_disabled, user_reenabled | RLS; auditoria; INCIDENT_RESPONSE |
| DSR (acesso, apagamento) | Titular → Responsável → ChefIApp | [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md); export ou apagamento | Ficheiro ao titular; registo de auditoria |

### 4.4 Auditoria

| Etapa | Origem | Transformação / Armazenamento | Destino / Uso |
|-------|--------|-------------------------------|---------------|
| Eventos de segurança e operação | Core, API, Auth | [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md); append-only; imutável | Persistência; consulta por Owner/Admin; export para auditoria (futuro) |

---

## 5. Futuro pipeline (Onda 3)

- **Objetivo:** Rastreio automatizado (ou semi-automatizado) de origem, transformação e uso de dados críticos.
- **Opções:** Metadados em tabelas/eventos (source, timestamp, job_id); ferramenta de lineage (ex.: OpenLineage, integração com stack existente); ou processo documentado com atualização periódica.
- **Prioridade:** Dados pessoais e exports (DSR, work log); depois pedidos e pagamentos; depois auditoria.
- **Critério de sucesso:** Possibilidade de responder “onde está este dado?” e “quem o consumiu ou exportou?” para dados críticos.

### 5.1 Processo simples de lineage (H2 Onda 3)

**Propósito:** Rastreio mínimo operacional sem ferramenta dedicada — processo documentado + verificação periódica.

1. **Ao adicionar ou alterar um RPC/job que lê ou escreve dados críticos** (gm_orders, gm_payments, gm_audit_logs, turn_sessions, gm_cash_registers):
   - **Atualizar §3** (Tabelas → fontes → consumidores) neste documento: acrescentar a nova fonte ou consumidor na linha correspondente à tabela.
   - **Auditoria:** Garantir que operações sensíveis continuam a emitir eventos em `gm_audit_logs` conforme [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) (ex.: order_created, payment_recorded, export_requested). O lineage de “quem escreveu” fica assim registado na trilha de auditoria.

2. **Verificação periódica (opcional):** Executar `./scripts/lineage-check.sh` (na raiz do repositório). O script lista, a partir de `supabase/migrations`, os ficheiros que escrevem em cada tabela crítica; usar o resultado para confirmar que §3 está em dia (nada novo nas migrações que não esteja documentado em §3). Ver [RUNBOOKS.md](../ops/RUNBOOKS.md) §11 (validação de docs e lineage).

---

## 6. Limitações atuais

- **Sem ferramenta de lineage em tempo real:** Lineage é documental e manual.
- **BaaS (Supabase):** Dados no Merchant Portal (auth, membros, pedidos em cloud) têm origem e fluxo distintos do Docker Core; documentar por contexto (piloto fechado vs cloud).
- **Exports:** Rastreio de quem pediu e quando deve ser registado conforme [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md); lineage de conteúdo do ficheiro exportado = manual (schema e tipo de export).

---

## 7. Revisão

- Este documento deve ser atualizado quando houver nova fonte de dados, novo tipo de export ou alteração de arquitetura (ex.: novo pipeline de dados).
- Implementação do pipeline (Onda 3, §5) deve ser refletida aqui e em [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md) / [METRICS_DICTIONARY.md](./METRICS_DICTIONARY.md) se aplicável.

---

**Referências:** [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) · [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md) · [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) · [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) · [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
