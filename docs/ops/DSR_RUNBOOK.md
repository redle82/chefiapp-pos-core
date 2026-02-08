# Runbook DSR — Pedidos do Titular (RGPD Art. 15–20)

**Data:** 1 de Fevereiro de 2026  
**Referência:** [DATA_SUBJECT_REQUESTS.md](../architecture/DATA_SUBJECT_REQUESTS.md) · Onda 2 C1–C4  
**Público:** DPO, equipa de suporte, owner/manager do restaurante.

---

## 1. Receção do pedido

1. O **titular** (utilizador/data subject) dirige o pedido ao **responsável** (restaurante/cliente), por e-mail, formulário ou canal definido na política de privacidade.
2. O **responsável** (ou DPO do cliente) regista:
   - Data de receção
   - Identificação do titular (e-mail, user_id no ChefIApp se aplicável)
   - Tipo de direito: **acesso**, **retificação**, **apagamento**, **portabilidade**, **limitação**, **oposição**
3. O responsável comunica ao ChefIApp (processador) o pedido no prazo acordado (ex.: 48 h úteis), ou executa diretamente no portal se tiver acesso.

**Prazo legal (RGPD art. 12(3)):** Resposta ao titular no máximo **1 mês** (prorrogável até 2 meses com justificação).

---

## 2. Registo do pedido no ChefIApp (C3)

Para rastreabilidade, registar o pedido na tabela `gm_dsr_requests`:

- **RPC:** `create_dsr_request(p_restaurant_id, p_subject_user_id, p_request_type, p_notes, p_deadline_at)`
- **Parâmetros:**
  - `p_restaurant_id`: UUID do restaurante (tenant)
  - `p_subject_user_id`: UUID do titular (auth.users.id)
  - `p_request_type`: `'access'` | `'rectification'` | `'erasure'` | `'portability'` | `'restriction'` | `'objection'`
  - `p_notes`: texto opcional
  - `p_deadline_at`: opcional (default: 30 dias)
- **Quem pode chamar:** Apenas owner ou manager do restaurante (autenticado).

**Exemplo (Supabase client):**

```ts
const { data } = await supabase.rpc('create_dsr_request', {
  p_restaurant_id: restaurantId,
  p_subject_user_id: subjectUserId,
  p_request_type: 'access',
  p_notes: 'Pedido de cópia de dados recebido em 2026-02-01',
});
// data = { ok: true, id: '<uuid>', deadline_at: '...' }
```

Consultar pedidos: `SELECT * FROM gm_dsr_requests WHERE tenant_id = '<restaurant_id>' ORDER BY requested_at DESC;` (com RLS, apenas owner/manager vê).

---

## 3. Execução por tipo de direito

### 3.1 Acesso (Art. 15) e Portabilidade (Art. 20)

- **Ação:** Export dos dados pessoais do titular associados ao tenant (membrosia, turnos, check-in/check-out).
- **RPC:** `get_dsr_access_export(p_restaurant_id, p_subject_user_id)`
- **Retorno:** JSON (schema_version `dsr_access_v1`) com `membership`, `shifts`, `check_ins`.
- **Efeito:** Regista automaticamente um pedido de tipo `access` com status `completed` em `gm_dsr_requests` e um evento em `gm_audit_logs`.
- **Entrega:** O responsável descarrega o JSON e entrega ao titular no prazo (ex.: link seguro, e-mail com ficheiro em anexo conforme política).

**Exemplo:**

```ts
const { data, error } = await supabase.rpc('get_dsr_access_export', {
  p_restaurant_id: restaurantId,
  p_subject_user_id: subjectUserId,
});
// data = { schema_version: 'dsr_access_v1', tenant_id, subject_id, membership, shifts, check_ins, ... }
```

### 3.2 Retificação (Art. 16)

- **Ação:** Corrigir dados inexatos ou incompletos do titular (ex.: nome, e-mail no perfil).
- **No ChefIApp:** Dados editáveis do titular podem ser alterados pelo owner/manager (ex.: gm_restaurant_members, perfil na app). Dados imutáveis por política não são alterados; documentar exceções conforme contrato.
- **Registo:** Atualizar o pedido em `gm_dsr_requests` (status → `completed`, completed_at, notes) ou registar via `create_dsr_request` com tipo `rectification` e depois atualizar manualmente.

### 3.3 Apagamento (Art. 17)

- **Ação:** Remover ou anonimizar os dados do titular, salvo retenção legal ou contratual.
- **No ChefIApp:** Processo manual ou semi-automatizado: desativar conta (ex.: `admin_disable_staff_member`), anonimizar em tabelas onde permitido, manter logs de auditoria conforme política de retenção. Não apagar registos que a lei exija conservar (ex.: fiscal).
- **Registo:** Criar pedido com tipo `erasure`; após execução, atualizar status para `completed` e notes com o âmbito do apagamento.

### 3.4 Limitação (Art. 18) e Oposição (Art. 21)

- **Ação:** Conforme instrução do responsável (ex.: flag de limitação de tratamento, cessar tratamento para determinada finalidade).
- **No ChefIApp:** Avaliar caso a caso; aplicar configurações ou processos acordados (ex.: desativar utilizador, restringir permissões). Documentar em `gm_dsr_requests` (notes) e responder ao responsável.

---

## 4. Resposta ao titular e prova

1. O **responsável** responde ao titular dentro do prazo legal (1 mês, prorrogável), com a informação ou o export conforme o direito exercido.
2. O **ChefIApp** mantém registo dos pedidos em `gm_dsr_requests` e das ações em `gm_audit_logs` (export de acesso, etc.) para demonstração de conformidade e auditoria.
3. Consultar audit log de exports: usar RPC `get_audit_logs` com `p_event_type = 'export_requested'` ou filtrar por `action = 'DSR_ACCESS_EXPORT'` (ver [AUDIT_LOG_QUERY.md](./AUDIT_LOG_QUERY.md)).

---

## 5. Referências rápidas

| Recurso | Descrição |
|--------|-----------|
| [DATA_SUBJECT_REQUESTS.md](../architecture/DATA_SUBJECT_REQUESTS.md) | Spec processo DSR |
| [AUDIT_LOG_QUERY.md](./AUDIT_LOG_QUERY.md) | Consulta trilha de auditoria |
| [WORK_LOG_EXPORT_RUNBOOK.md](./WORK_LOG_EXPORT_RUNBOOK.md) | Export work log (compliance laboral) |
| Tabela `gm_dsr_requests` | Registo de pedidos DSR (tenant_id, subject_id, request_type, status, deadline_at) |
| RPC `get_dsr_access_export` | Export de acesso/portabilidade (dados do titular) |
| RPC `create_dsr_request` | Registo de pedido DSR (qualquer tipo) |

---

**Referências:** [DATA_SUBJECT_REQUESTS.md](../architecture/DATA_SUBJECT_REQUESTS.md) · [GDPR_MAPPING.md](../architecture/GDPR_MAPPING.md) · [AUDIT_LOG_SPEC.md](../architecture/AUDIT_LOG_SPEC.md)
