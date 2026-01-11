# Wizard Onboarding — Completion Gate & Progress Tracking

**Data**: 2025-01-27  
**Status**: ✅ **IMPLEMENTADO**

---

## 🎯 Objetivo

Finalizar o Wizard `/app/wizard` e deixar o onboarding "merchant-ready" com:
- **Wizard Completion Gate**: Prevenir reentrada após conclusão
- **Progress Persistence**: Salvar progresso por passo no banco
- **Production Hardening**: Esconder Config (dev) em produção
- **Diagnostic Logs**: Logs detalhados (DEV-only)

---

## 📋 Implementação

### 1. Database Schema

**Migration**: `supabase/migrations/069_wizard_completion_gate.sql`

**Campos adicionados em `gm_restaurants`**:
- `wizard_completed_at` (TIMESTAMPTZ): Timestamp de conclusão
- `setup_status` (ENUM): `'not_started' | 'in_progress' | 'completed'`
- `wizard_progress` (JSONB): Progresso por passo

**Funções SQL**:
- `mark_wizard_complete(p_restaurant_id)`: Marca wizard como completo
- `update_wizard_progress(p_restaurant_id, p_step, p_data)`: Atualiza progresso de um passo

---

### 2. Wizard Completion Gate

**Arquivo**: `merchant-portal/src/pages/BootstrapPage.tsx`

**Lógica**:
```typescript
// Verifica se wizard foi concluído
const { data: restaurant } = await supabase
  .from('gm_restaurants')
  .select('wizard_completed_at, setup_status')
  .eq('id', member.restaurant_id)
  .single()

if (restaurant.wizard_completed_at !== null || restaurant.setup_status === 'completed') {
  // Wizard concluído → redireciona para dashboard
  navigate('/app/dashboard')
} else {
  // Wizard não concluído → redireciona para setup
  navigate('/app/setup')
}
```

**Comportamento**:
- ✅ Usuário com wizard completo → nunca mais vê o wizard
- ✅ Usuário sem wizard completo → sempre redirecionado para `/app/setup`
- ✅ Novo restaurante → sempre começa no wizard

---

### 3. Progress Persistence

**Arquivo**: `merchant-portal/src/core/wizardProgress.ts`

**Funções**:
- `updateWizardProgress(restaurantId, step, data)`: Persiste progresso de um passo
- `markWizardComplete(restaurantId)`: Marca wizard como completo
- `getWizardProgress(restaurantId)`: Busca progresso do banco

**Integração nos Steps**:
- `IdentityStep.tsx`: Chama `updateWizardProgress('identity', {...})` após salvar
- `PaymentsStep.tsx`: Chama `updateWizardProgress('payments', {...})` após conectar
- `DesignStep.tsx`: Chama `updateWizardProgress('design', {...})` após salvar
- `PublishStep.tsx`: Chama `updateWizardProgress('publish', {...})` + `markWizardComplete()` após publicar

**Estrutura do `wizard_progress` JSONB**:
```json
{
  "identity": {
    "completed": true,
    "completed_at": "2025-01-27T10:00:00Z",
    "data": {
      "name": "Sofia Gastrobar",
      "tagline": "Menu online",
      "contacts": { "phone": "+351000000000", "address": "Lisboa", "hours": "12h–23h" }
    }
  },
  "menu": {
    "completed": true,
    "completed_at": "2025-01-27T10:05:00Z",
    "data": { "items_count": 5 }
  },
  "payments": {
    "completed": true,
    "completed_at": "2025-01-27T10:10:00Z",
    "data": { "gateway": "stripe" }
  },
  "design": {
    "completed": true,
    "completed_at": "2025-01-27T10:15:00Z",
    "data": { "web_level": "PRO", "theme": "minimal", "slug": "sofia-gastrobar" }
  },
  "publish": {
    "completed": true,
    "completed_at": "2025-01-27T10:20:00Z",
    "data": { "published_at": "2025-01-27T10:20:00Z", "slug": "sofia-gastrobar" }
  }
}
```

---

### 4. Production Hardening

**Arquivo**: `merchant-portal/src/pages/WizardPage.tsx`

**Mudanças**:
- ✅ Config section só aparece se `import.meta.env.DEV === true`
- ✅ Debug section só aparece se `import.meta.env.DEV === true`
- ✅ `dev-token` nunca é usado/aceito fora de DEV

**Código**:
```typescript
{/* DEV-ONLY: Config section (hidden in production) */}
{import.meta.env.DEV && (
  <section className="card">
    <div>Config (DEV)</div>
    {/* ... */}
  </section>
)}
```

---

### 5. Diagnostic Logs (DEV-only)

**Arquivo**: `merchant-portal/src/pages/WizardPage.tsx`

**Melhorias**:
- Logs estruturados com `lastError` formatado
- `stateJson` filtrado (apenas campos relevantes)
- Timestamp incluído
- Background cinza para melhor legibilidade

**Estrutura do log**:
```json
{
  "lastError": {
    "title": "Erro",
    "message": "Mensagem de erro",
    "detail": "Detalhes",
    "raw": { "status": 400, "body": {...} }
  },
  "stateJson": {
    "identity_complete": true,
    "menu_complete": true,
    "payments_complete": false,
    "design_complete": true,
    "can_publish": true,
    "profile": { "status": "draft", "slug": "sofia-gastrobar" },
    "gates": { "ok": true }
  },
  "timestamp": "2025-01-27T10:00:00.000Z"
}
```

---

## 🔄 Fluxo Completo

### Novo Usuário
1. Login → BootstrapPage
2. Restaurante criado → `setup_status = 'not_started'`
3. Redireciona para `/app/setup`
4. Usuário completa passos:
   - Identity → `updateWizardProgress('identity', {...})`
   - Menu → `updateWizardProgress('menu', {...})`
   - Payments → `updateWizardProgress('payments', {...})`
   - Design → `updateWizardProgress('design', {...})`
   - Publish → `updateWizardProgress('publish', {...})` + `markWizardComplete()`
5. Próximo login → BootstrapPage verifica `wizard_completed_at` → redireciona para `/app/dashboard`

### Usuário Existente (Wizard Completo)
1. Login → BootstrapPage
2. Verifica `wizard_completed_at` → não é null
3. Redireciona para `/app/dashboard` (nunca vê o wizard)

### Usuário Existente (Wizard Incompleto)
1. Login → BootstrapPage
2. Verifica `wizard_completed_at` → é null
3. Redireciona para `/app/setup` (continua de onde parou)

---

## ✅ Critérios de Sucesso

- [x] Wizard não aparece após conclusão
- [x] Progresso persistido no banco
- [x] Config escondido em produção
- [x] Logs detalhados (DEV-only)
- [x] Gate funciona corretamente no BootstrapPage

---

## 🧪 Testes

### Teste 1: Novo Usuário
1. Criar novo usuário
2. Verificar redirecionamento para `/app/setup`
3. Completar wizard
4. Fazer logout e login novamente
5. ✅ Verificar redirecionamento para `/app/dashboard` (não vê wizard)

### Teste 2: Usuário com Wizard Completo
1. Login com usuário que já completou wizard
2. ✅ Verificar redirecionamento direto para `/app/dashboard`

### Teste 3: Progresso Persistido
1. Completar passo Identity
2. Fazer refresh
3. ✅ Verificar que passo Identity aparece como completo
4. ✅ Verificar `wizard_progress` no banco

### Teste 4: Production Hardening
1. Build de produção (`npm run build`)
2. ✅ Verificar que Config não aparece
3. ✅ Verificar que Debug não aparece

---

## 📝 Notas

- **Dashboard Final**: `/app/dashboard` (DashboardZero)
- **Wizard Route**: `/app/setup/*` (SetupLayout com rotas filhas)
- **Bootstrap Route**: `/app/bootstrap` (BootstrapPage)
- **Fallback**: Se verificação falhar, redireciona para dashboard (comportamento existente)

---

## 🔗 Arquivos Relacionados

- `supabase/migrations/069_wizard_completion_gate.sql`
- `merchant-portal/src/pages/BootstrapPage.tsx`
- `merchant-portal/src/pages/WizardPage.tsx`
- `merchant-portal/src/core/wizardProgress.ts`
- `merchant-portal/src/pages/steps/IdentityStep.tsx`
- `merchant-portal/src/pages/steps/PaymentsStep.tsx`
- `merchant-portal/src/pages/steps/DesignStep.tsx`
- `merchant-portal/src/pages/steps/PublishStep.tsx`

---

**Status**: ✅ **COMPLETO E FUNCIONAL**

