# Incident Playbook: Dispositivo Roubado (Sessão Ativa)

**Cenário:** Telefone/celular do staff roubado com app logado (JWT em localStorage / sessão Supabase).

**Objetivo:** Conter em minutos, auditar e recuperar — usando Supabase Auth, RLS, Edge Functions, DbWriteGate, Sentry e Core Installer.

---

## 1. Timeline do incidente

| Tempo        | O que acontece                                         | Comportamento do sistema                                                                                                                                                                                          |
| ------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T+0 min**  | Atacante abre o app no dispositivo roubado             | App continua autenticado (token existe). **RLS** garante que ele só lê o que o usuário tem direito via `gm_restaurant_members`. **Não consegue ver outro restaurante** mesmo com token válido.                    |
| **T+5 min**  | Tentativa de “escapar do app” (chamadas diretas à API) | **RLS** continua bloqueando leitura/escrita fora do tenant. **Edge Functions** retornam 401 se não houver `getUser()` válido.                                                                                     |
| **T+10 min** | Dano real possível                                     | Atacante pode executar **ações legítimas do próprio usuário**: criar pedidos, alterar tarefas, causar caos operacional **apenas no restaurante da vítima**. RLS não impede isso (é o usuário legítimo no tenant). |

**Resumo:** Vazamento transversal (outros restaurantes) é contido. O risco é **dentro do tenant** (pedidos falsos, alterações indevidas).

---

## 2. Contenção imediata (≈ 2 minutos)

### 2.1 Revogar sessão do usuário comprometido

**Opção A — Supabase Dashboard (Auth)**

1. Acesse **Authentication → Users**.
2. Localize o usuário (email ou ID).
3. Use **“Sign out” / “Revoke sessions”** (ou equivalente do projeto) para invalidar todos os tokens.

**Opção B — Desativar membro (kill switch no app)**

1. Gerente/dono usa o botão **“Bloquear staff”** no portal (se implementado).
2. Isso chama o RPC `admin_disable_staff_member(user_id, restaurant_id, reason)`, que:
   - Define `gm_restaurant_members.disabled_at = now()` para aquele usuário naquele restaurante.
   - Grava evento de auditoria em `app_logs` (action, user_id, restaurant_id, reason, performed_by).
3. As funções RLS (`user_restaurant_ids()`, `get_user_restaurants()`, etc.) consideram apenas membros com `disabled_at IS NULL`, então o token deixa de ter acesso a dados do restaurante.

**Opção C — API Admin Supabase (revogar sessões)**
Se disponível no seu plano, use a Admin API para revogar todos os refresh tokens do usuário.

**Resultado esperado:** O token roubado deixa de conseguir acessar dados (401 ou zero restaurantes visíveis).

---

## 3. Queries de auditoria

### 3.1 Pedidos criados pelo usuário (janela do ataque)

```sql
-- Pedidos criados pelo usuário nas últimas 2 horas (ajuste o intervalo)
SELECT id, restaurant_id, status, total_cents, created_at, created_by
FROM public.gm_orders
WHERE created_by = '<USER_ID>'
  AND created_at > now() - interval '2 hours'
ORDER BY created_at DESC;
```

### 3.2 Logs do app (eventos e erros)

```sql
-- Eventos/erros associados ao usuário nas últimas 24h
SELECT id, level, message, details, restaurant_id, created_at
FROM public.app_logs
WHERE details->>'userId' = '<USER_ID>'
   OR details->>'user_id' = '<USER_ID>'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

### 3.3 Eventos de segurança (disable / reenable / sessão revogada)

```sql
-- Ações administrativas de bloqueio/desbloqueio
SELECT id, level, message, details, restaurant_id, created_at
FROM public.app_logs
WHERE message IN ('user_disabled', 'user_reenabled', 'security_session_revoked')
  AND created_at > now() - interval '7 days'
ORDER BY created_at DESC;
```

### 3.4 Incidentes nas últimas 24h (painel rápido)

```sql
-- Eventos de segurança para painel "Incidentes nas últimas 24h"
SELECT id, level, message, details->>'target_user_id' AS target_user_id, details->>'performed_by' AS performed_by, restaurant_id, created_at
FROM public.app_logs
WHERE message IN ('user_disabled', 'user_reenabled', 'security_session_revoked', 'security_incident_opened', 'security_incident_closed')
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

**Registro de `security_session_revoked`:** Ao revogar sessões via Supabase Dashboard (Auth → Revoke sessions), registre manualmente em `app_logs` (via SQL ou ferramenta de suporte) para manter o audit trail:

```sql
INSERT INTO public.app_logs (level, message, details, restaurant_id)
VALUES (
  'info', 'security_session_revoked',
  jsonb_build_object('action', 'security_session_revoked', 'target_user_id', '<USER_ID>', 'performed_by', '<ADMIN_ID_OU_SISTEMA>', 'reason', 'Revogação via Dashboard'),
  NULL
);
```

Substitua `<USER_ID>` pelo UUID do usuário comprometido.

---

## 4. Mitigar dano operacional (5–15 min)

1. **Cancelar ou marcar pedidos falsos** com base na query de pedidos (seção 3.1).
2. **Definir a janela do ataque** (primeiro e último evento suspeito) usando `created_at` e `app_logs`.
3. Documentar decisões (ex.: “pedidos X, Y, Z cancelados por incidente de segurança”).

---

## 5. Verificação forense leve (15–30 min)

- Verificar **picos de criação de pedidos** ou alterações em massa.
- Checar **acesso a recursos sensíveis** (telas/funcionalidades fora do padrão do usuário).
- Revisar **Sentry** (breadcrumbs, contexto userId/restaurantId/role/appVersion/device) para padrões anômalos (bursts, erros repetidos, device diferente).

---

## 6. Recuperação (mesmo dia)

1. **Reativar o usuário** apenas após:
   - Reset de senha ou novo magic link.
   - Chamada a `admin_reenable_staff_member(user_id, restaurant_id, reason)` (se usar disable por membro).
   - Limpar sessão no cliente (logout) e exigir novo login.
2. Opcional: invalidar refresh tokens no Supabase (revogar sessões) antes de permitir novo login.

---

## 7. Checklist pós-incidente

- [ ] Sessão do usuário revogada ou membro desativado.
- [ ] Queries de auditoria executadas e janela do ataque documentada.
- [ ] Pedidos falsos cancelados ou marcados como suspeitos.
- [ ] Logs e Sentry revisados para padrões anômalos.
- [ ] Usuário reativado somente após reset de senha/novo login e (se aplicável) reenable via RPC.
- [ ] Regra operacional: gerente/dono pode “bloquear staff” rapidamente; evento registrado em `app_logs`.

---

## 8. Onde o sistema já ajuda

| Componente                                       | Papel no incidente                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| **RLS**                                          | Limita o estrago ao restaurante do usuário; evita incidente global.         |
| **Edge Functions**                               | Retornam 401 se `getUser()` não for válido.                                 |
| **DbWriteGate / app_logs**                       | Audit trail (user_id, restaurant_id, timestamps, writes suspeitos).         |
| **Sentry**                                       | Padrões anormais (bursts, erros, device/app version/user id).               |
| **Core Installer (UFW / Tailscale / 127.0.0.1)** | Mantém o incidente no nível de usuário; não vira invasão de infraestrutura. |

---

## 9. Referências

- [docs/security.md](../security.md) — Visão geral de autenticação e RLS.
- RPCs: `admin_disable_staff_member`, `admin_reenable_staff_member` (implementados).
- Supabase Auth: [Admin API](https://supabase.com/docs/reference/javascript/auth-admin-api) para revogar sessões.

---

## 10. Arquivos verificados (validação disabled_at + RPC hardening)

| Área               | Arquivo                                                                                                                       | O que foi verificado/alterado                                                                                                                                                                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Migration**      | `supabase/migrations/20260228100000_add_staff_disable_and_audit.sql`                                                          | Coluna `disabled_at`, helpers RLS com `disabled_at IS NULL`, RPCs disable/reenable                                                                                                                                                                                                                |
| **Migration**      | `supabase/migrations/20260228110000_disabled_at_policies_and_rpc_hardening.sql`                                               | Policies em `gm_restaurant_members`, `gm_cash_registers`, `gm_orders`, `gm_order_items`, `integration_orders`, `turn_sessions` com `disabled_at IS NULL`; `start_turn` e `create_order_atomic` com membro ativo; RPC `admin_disable_staff_member` blindado (manager só staff, nunca último owner) |
| **RLS helpers**    | `user_restaurant_ids()`, `get_user_restaurants()`, `get_user_restaurant_id()`, `is_user_member_of_restaurant()`               | Todas consideram `disabled_at IS NULL` (definidas em 20260228100000)                                                                                                                                                                                                                              |
| **RPC**            | `admin_disable_staff_member`                                                                                                  | Caller pertence ao restaurante; manager só desativa staff; owner pode desativar manager/staff; nunca desativa último owner; target deve ser membro do restaurante                                                                                                                                 |
| **RPC**            | `admin_reenable_staff_member`                                                                                                 | Caller owner/manager ativo; audit em app_logs                                                                                                                                                                                                                                                     |
| **Edge Functions** | `_shared/auth.ts`                                                                                                             | `requireUser()` retorna 401; comentário CORS/OPTIONS                                                                                                                                                                                                                                              |
| **Edge Functions** | `stripe-billing`, `cancel-subscription`, `change-plan`, `update-subscription-status`, `create-subscription`, `stripe-payment` | Usam `requireUser()`; OPTIONS tratado no início de cada handler                                                                                                                                                                                                                                   |
| **Front**          | `merchant-portal/src/core/incident/StaffIncidentService.ts`                                                                   | `disableStaffMember()`, `reenableStaffMember()` chamam os RPCs                                                                                                                                                                                                                                    |
| **Nota**           | `process_order_payment` (20260114224500)                                                                                      | Security check ainda usa `gm_restaurant_members` sem `disabled_at`; recomenda-se recriar a função trocando por `is_user_member_of_restaurant(p_restaurant_id)` no bloco de autorização                                                                                                            |
