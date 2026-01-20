# Audit: Tenant Minimal Viable Existence (TMVE)

## 0. Resumo da Auditoria
Para um restaurante existir e operar no ChefIApp, ele precisa de **5 Entidades Obrigatórias** e **3 Configurações Mínimas**.
Qualquer fluxo de cadastro (Self-Service) precisa orquestrar isso atomicamente.

---

## 1. Entidades Obrigatórias (Ordem de Criação)

### 1.1 `companies` (Root)
- **Função:** Entidade legal dona do restaurante.
- **Campos Obrigatórios:** `company_id` (UUID), `name`.
- **Status:** Sem dependências.

### 1.2 `restaurant_web_profiles` (O Restaurante)
- **Função:** A identidade pública e operacional.
- **Campos Obrigatórios:**
  - `restaurant_id` (UUID)
  - `company_id` (FK)
  - `slug` (Unique, ex: "marios-pizza")
  - `status` ('published' | 'draft')
  - `theme` (JSON default)
  - `web_level` (BASIC)
- **Dependência:** Requer `company_id`.

### 1.3 `profiles` (O Humano / Owner)
- **Função:** O usuário autenticado que gere o negócio.
- **Campos Obrigatórios:** `id` (Supabase Auth ID), `role` ('owner').
- **Nota:** Criado automaticamente pelo Supabase Auth, mas precisa de *upsert* com role.

### 1.4 `restaurant_members` (Vínculo)
- **Função:** Permite o humano acessar o restaurante.
- **Campos Obrigatórios:** `restaurant_id`, `user_id`, `role` ('owner').
- **Status:** Crítico. Sem isso, o usuário cria a conta mas não vê nada (Dashboard vazio).

### 1.5 `menu_categories` & `menu_items` (Contexto Operacional)
- **Função:** O ChefIApp não opera sem menu.
- **Mínimo:** 1 Categoria ("Destaques"), 1 Item ("Hambúrguer Exemplo").

---

## 2. Configurações & Defaults (Hardcoded no Script, Dinâmico no Signup)

### A. Gateways & Pagamentos
- **Atualmente:** Script injeta `merchant_gateway_credentials` (Stripe).
- **No Signup:** Deve iniciar VAZIO. O Owner configura depois.
- **Impacto:** O restaurante nasce sem aceitar pagamentos online (apenas dinheiro/POS físico) até configurar.

### B. Slug Generation
- **Atualmente:** Hardcoded `sofia-gastrobar` ou ENV.
- **No Signup:** Deve ser derivado do nome do restaurante (sanitize + unique check).

### C. Pulse (Vida)
- **Atualmente:** `sendPulse` hardcoded para 'sofia-gastrobar'.
- **No Signup:** `sendPulse` deve ser dinâmico (ler `restaurant_id` do contexto).

---

## 3. Plano de Ação: `TenantEngine`

Precisamos de uma Server Action / Edge Function que execute:

```typescript
function createTenantFromSignup(input: {
  ownerEmail: string,
  ownerPassword: string,
  restaurantName: string
}) {
  // 1. Auth: Criar Usuário no Supabase Auth
  // 2. DB Transaction:
  //    - Insert Company
  //    - Insert Restaurant (Slugify name)
  //    - Insert Profile (Role: Owner)
  //    - Insert Member (Owner link)
  //    - Insert Menu Placeholder
  // 3. Genesis: Emitir First Pulse (Viva!)
}
```

## 4. O que falta no código atual (Gap Analysis)

1.  **Auth RPC / Admin Client:** O script usa `pg` direto. O app precisa usar Supabase Admin para criar usuário Auth programaticamente, OU o usuário cria a conta no frontend e o trigger/action completa o resto.
    *   *Recomendação:* Usuário cria conta (Auth) -> Trigger ou Webhook chama `crateTenant`.

2.  **Contexto Dinâmico no Pulse:** O arquivo `empire-pulse.ts` tem `tenant_slug: 'sofia-gastrobar'` hardcoded na linha 45. **Isso impede multi-tenancy.**

---

**Conclusão da Auditoria:**
O sistema está pronto em termos de Schema, mas o código de *runtime* (Pulse) e *criação* (Seed) está acoplado ao `sofia-gastrobar`.
Ação imediata: **Generalizar o Pulse** e **Criar o Engine de Signup**.
