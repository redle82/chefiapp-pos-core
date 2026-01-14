# 🔍 OPUS 4.5 — AUDITORIA OFICIAL CHEFIAPP OS
## Auditoria de Arquitetura, Semântica e Verdade

**Data:** 2026-01-20  
**Versão:** Opus 4.5  
**Tipo:** Auditoria Arquitetural Completa  
**Status:** ✅ CONCLUÍDA

---

## 🎯 OBJETIVO DA AUDITORIA

Garantir que:
- ✅ O sistema faz apenas o que promete
- ✅ Não existem portais paralelos
- ✅ Não há estados zumbis
- ✅ Não existe UI mentirosa
- ✅ Nenhum fluxo burla os contratos das fases

---

## 🧠 1. AUDITORIA DE FASES (FOUNDATION / ACTIVATION / OPERATION)

### ❓ O que foi verificado
- Telas acessíveis fora da fase correta
- Guards duplicados ou contraditórios
- Estados parcialmente persistidos
- Flags antigas ainda influenciando fluxo

### 🔎 Checklist

#### ✅ É impossível acessar /activation sem onboarding_completed
**Status:** 🟡 **PARCIALMENTE PROTEGIDO**

**Evidência:**
- `FlowGate.tsx:77-100` - Bloqueia acesso a `/app/*` se `onboardingStatus !== 'completed'`
- `CoreFlow.ts:77-100` - Redireciona para `/onboarding/start` se não completo
- **PROBLEMA:** `/activation` não está protegido diretamente pelo FlowGate
- `RequireActivation.tsx:20-73` - Verifica `operation_mode` mas não verifica `onboarding_completed_at`

**Risco:** Usuário pode acessar `/activation` diretamente via URL antes de completar onboarding.

**Recomendação:**
```typescript
// Adicionar em ActivationPage.tsx ou criar guard específico
if (!onboarding_completed_at) {
  navigate('/onboarding/start', { replace: true });
}
```

#### ✅ É impossível acessar /app/* sem activation_completed
**Status:** 🟢 **PROTEGIDO**

**Evidência:**
- `RequireActivation.tsx:20-73` - Guard funcional
- `DashboardZero.tsx:86-100` - Guard duplicado (redundante mas seguro)
- Verifica `chefiapp_operation_mode` no localStorage
- Fallback para `restaurant.operation_status === 'active'` no DB

**Observação:** Guard duplicado em `DashboardZero` é redundante mas não prejudicial.

#### ⚠️ O FOE não reabre após concluído
**Status:** 🟡 **PROTEGIDO COM FALHA-SEGURA**

**Evidência:**
- `CoreFlow.ts:118-124` - Bloqueia acesso a `/onboarding/*` se `onboardingStatus === 'completed'`
- `FlowGate.tsx:120-124` - Redireciona para `/app/dashboard` se tentar acessar onboarding completo
- **EXCEÇÃO:** Mobile users são redirecionados para `/onboarding/foundation` (linha 108-115)

**Risco:** Mobile users podem acessar `/onboarding/foundation` mesmo após completar, mas isso é intencional (tela de fundação).

#### ✅ Não existe lógica de fase em componentes visuais (só nos guards)
**Status:** 🟢 **CORRETO**

**Evidência:**
- Guards centralizados em `FlowGate` e `CoreFlow`
- Componentes apenas leem estado, não decidem navegação
- `DashboardZero` tem guard mas é redundante (não prejudicial)

### 📌 Cheiros de Problema Encontrados

#### 🟡 Guard Duplicado (Não Crítico)
```typescript
// DashboardZero.tsx:86-100
// RequireActivation.tsx:20-73
// Ambos verificam operation_mode
```
**Veredito:** Redundante mas não prejudicial. Considerar consolidar.

#### 🟡 Bypass de Dev Exposto
```typescript
// RequireActivation.tsx:30
if (urlParams.get('skip_activation')) {
  setIsVerified(true);
  return;
}
```
**Risco:** Bypass disponível em produção via URL. Deve ser restrito a `NODE_ENV === 'development'`.

### ✔️ Correto: 1 Guard Central, o resto obedece
**Status:** 🟢 **IMPLEMENTADO**

- `FlowGate` é a autoridade única para navegação
- `CoreFlow.resolveNextRoute` é função pura determinística
- Componentes não decidem navegação, apenas leem estado

---

## 🧬 2. AUDITORIA DE ESTADO & VERDADE (Single Source of Truth)

### ❓ O que foi verificado
- Valores duplicados (LocalStorage + Supabase sem hierarquia)
- Flags que não significam mais nada
- Estados "temporários" que viraram permanentes

### 🔎 Checklist

#### ⚠️ Definição clara: o que é canônico
**Status:** 🟡 **PARCIALMENTE DEFINIDO**

**Evidência:**
- **Canônico (DB):** `onboarding_completed_at`, `operation_status`, `setup_status`
- **Cache (LocalStorage):** `chefiapp_operation_mode`, `chefiapp_setup_status`, `chefiapp_restaurant_id`
- **Problema:** Hierarquia não é sempre respeitada

**Exemplo de Inconsistência:**
```typescript
// FlowGate.tsx:115-156
// Verifica DB primeiro, mas depois confia em localStorage como "fail-safe"
if (restaurant.onboarding_completed_at) {
  status = 'completed';
} else {
  // 🛑 DB says NOT completed. BUT check "Fail-Safe" Local State
  const rawBp = getTabIsolated('chefiapp_system_blueprint_v2');
  if (rawBp && bp.organization?.realityStatus === 'real') {
    status = 'completed'; // ⚠️ LocalStorage sobrescreve DB
  }
}
```

**Risco:** LocalStorage pode sobrescrever verdade do DB, criando estado inconsistente.

#### ⚠️ O que é cache
**Status:** 🟡 **DEFINIDO MAS NÃO SEMPRE RESPEITADO**

**Evidência:**
- `TabIsolatedStorage.ts` - Implementa cache tab-isolated
- Migração de `localStorage` para `sessionStorage` em andamento
- **Problema:** Alguns componentes ainda leem diretamente de `localStorage`

**Exemplo:**
```typescript
// RequireActivation.tsx:38
const localOpMode = getTabIsolated('chefiapp_operation_mode');
// ✅ Usa TabIsolatedStorage (correto)

// Mas alguns lugares ainda usam localStorage diretamente
```

#### ✅ O que é fallback
**Status:** 🟢 **BEM DEFINIDO**

**Evidência:**
- `FlowGate.tsx:347-363` - Fail-safe para tenant resolution
- `RequireActivation.tsx:44-56` - Fallback para DB se localStorage vazio
- Fallbacks são explícitos e documentados

#### ❌ Nenhum estado crítico depende só do browser
**Status:** 🔴 **VIOLAÇÃO ENCONTRADA**

**Evidência:**
- `RequireActivation.tsx:38-42` - Se `localOpMode` existe, permite acesso SEM verificar DB
- `DashboardZero.tsx:93-100` - Verifica apenas `localStorage`, não DB
- **Risco:** Se usuário limpar cache, perde acesso mesmo com DB correto

**Exemplo Crítico:**
```typescript
// RequireActivation.tsx:38-42
const localOpMode = getTabIsolated('chefiapp_operation_mode');
if (localOpMode) {
  setIsVerified(true); // ⚠️ Permite acesso SEM verificar DB
  return;
}
```

### 📌 Cheiros de Problema Encontrados

#### 🔴 LocalStorage como Fonte de Verdade
```typescript
// RequireActivation.tsx:38-42
if (localOpMode) {
  setIsVerified(true); // ⚠️ Não verifica DB
  return;
}
```
**Risco:** Estado crítico (activation) depende apenas de cache.

#### 🟡 Fail-Safe Invertido
```typescript
// FlowGate.tsx:115-156
// DB diz "não completo", mas localStorage diz "completo" → confia em localStorage
```
**Risco:** Fail-safe deveria ser DB → LocalStorage, não o contrário.

### ✔️ Correto: "Se não está no backend, é ilusão"
**Status:** 🔴 **NÃO IMPLEMENTADO**

**Problema:** Sistema ainda confia em localStorage como fonte primária em alguns lugares.

**Recomendação:**
1. Sempre verificar DB primeiro
2. Usar localStorage apenas como cache de performance
3. Se DB e cache divergem, DB vence

---

## 🧱 3. AUDITORIA DE CONTRATOS (Semântica > Código)

### ❓ O que foi verificado
- Campos com nome bonito mas significado ambíguo
- Flags que mudaram de função ao longo do tempo
- Estados booleanos que deveriam ser enum

### 🔎 Checklist

#### ⚠️ setup_status ainda faz sentido?
**Status:** 🟡 **SEMÂNTICA CONFUSA**

**Evidência:**
- `setup_status` tem 4 valores: `'not_started' | 'quick_done' | 'advanced_in_progress' | 'advanced_done'`
- **Problema:** `quick_done` e `advanced_done` são ambíguos
- **Histórico:** Migração de enum antigo para novo (linha 58-77 em migration)

**Uso Atual:**
```typescript
// DashboardZero.tsx:74
const [setupStatus, setSetupStatus] = useState<'not_started' | 'quick_done' | 'advanced_in_progress' | 'advanced_done'>('not_started');
```

**Problema Semântico:**
- `quick_done` = Onboarding rápido completo
- `advanced_done` = Setup avançado completo
- **Mas:** O que acontece se usuário faz quick e depois advanced? Estado fica `advanced_done`?
- **Risco:** Não fica claro se `quick_done` é subconjunto de `advanced_done` ou estados mutuamente exclusivos

#### ⚠️ advanced_done é realmente final?
**Status:** 🟡 **NÃO CLARO**

**Evidência:**
- `AdvancedSetupPage.tsx:134` - Marca `advanced_done` quando `markDone = true`
- **Problema:** Não há garantia de que `advanced_done` é estado final
- **Risco:** Usuário pode voltar e editar, mas estado permanece `advanced_done`?

**Recomendação:** Adicionar timestamp `advanced_completed_at` similar a `onboarding_completed_at`.

#### ⚠️ operation_mode cobre TODOS os casos?
**Status:** 🟡 **LIMITADO**

**Evidência:**
- `ActivationPage.tsx:16-19` - Configura `operationMode: 'Gamified' | 'Executive'`
- `RequireActivation.tsx:48-49` - Verifica `operation_mode === 'Gamified' || 'Active'`
- **Problema:** `'Active'` não é configurado em `ActivationPage`, apenas `'Gamified'` e `'Executive'`
- **Risco:** Inconsistência entre valores configuráveis e valores verificados

**Valores Configuráveis:**
- `'Gamified'` ✅
- `'Executive'` ✅

**Valores Verificados:**
- `'Gamified'` ✅
- `'Active'` ⚠️ (não configurável)
- `'Gamified' || 'Active'` ⚠️ (lógica OR ambígua)

#### ⚠️ device_role nunca se sobrepõe a role de usuário?
**Status:** 🟡 **NÃO VERIFICADO**

**Evidência:**
- `device_role` é armazenado em `localStorage` (`chefiapp_device_role`)
- `useDevicePermissions.ts:9` - Lê `device_role` para permissões
- **Problema:** Não há verificação se `device_role` conflita com `user.role` do DB
- **Risco:** Usuário pode ter `role: 'staff'` no DB mas `device_role: 'manager'` no localStorage

**Recomendação:** Validar `device_role` contra `user.role` do DB.

### 📌 Cheiros de Problema Encontrados

#### 🔴 Campo Sem Contrato Claro
```typescript
// setup_status: 'quick_done' | 'advanced_done'
// Não fica claro se são mutuamente exclusivos ou hierárquicos
```
**Risco:** Dívida técnica futura quando precisar adicionar novos estados.

#### 🟡 Enum Inconsistente
```typescript
// ActivationPage configura: 'Gamified' | 'Executive'
// RequireActivation verifica: 'Gamified' | 'Active'
// 'Active' não é configurável
```
**Risco:** Lógica de verificação pode falhar silenciosamente.

### ✔️ Campo sem contrato = dívida técnica futura
**Status:** 🟡 **ALGUNS CAMPOS SEM CONTRATO CLARO**

**Campos com Contrato Claro:**
- ✅ `onboarding_completed_at` - Timestamp canônico
- ✅ `onboardingStatus` - Enum bem definido

**Campos Sem Contrato Claro:**
- ⚠️ `setup_status` - Hierarquia não clara
- ⚠️ `operation_mode` - Valores inconsistentes
- ⚠️ `device_role` - Não validado contra DB

---

## 🎭 4. AUDITORIA DE UX HONESTA (UI NÃO MENTE)

### ❓ O que foi verificado
- Botões que levam a "coming soon" sem aviso prévio
- Cards "ativos" que não fazem nada
- Promessas implícitas (especialmente em mobile)

### 🔎 Checklist

#### ⚠️ Toda ação gera consequência real
**Status:** 🟡 **PARCIALMENTE HONESTO**

**Evidência:**
- `DashboardZero.tsx:283-301` - Cards de módulos verificam `module.status !== 'active'`
- Se inativo, redireciona para `/app/coming-soon?module=${module.id}`
- **Problema:** Card mostra como "ativo" mas pode não ter `path` definido

**Exemplo:**
```typescript
// DashboardZero.tsx:283-301
if (module.status !== 'active' || !module.path) {
  return (
    <ModuleCard
      onClick={() => navigate(`/app/coming-soon?module=${module.id}`)}
    />
  );
}
```

**Observação:** ✅ Cards inativos redirecionam para "coming soon" (honesto).

#### ✅ O usuário nunca se pergunta "cadê?"
**Status:** 🟢 **BEM IMPLEMENTADO**

**Evidência:**
- `ComingSoonPage.tsx` - Página dedicada explica o que está vindo
- `SystemMapCard.tsx:66-94` - Seção "Em breve" lista features futuras
- Badges de status (`'active' | 'locked' | 'planned'`) são visíveis

#### ✅ Mobile nunca promete TPV
**Status:** 🟢 **PROTEGIDO**

**Evidência:**
- `CoreFlow.ts:105-116` - Mobile users são redirecionados para `/onboarding/foundation`
- Bloqueia acesso a `/app/*` em mobile
- **Exceção:** `/public/*` é permitido (menu público)

#### ✅ DashboardZero mostra estado real, mesmo vazio
**Status:** 🟢 **HONESTO**

**Evidência:**
- `DashboardZero.tsx:187-213` - Banner mostra "Ritual Avançado Pendente" se `setupStatus !== 'advanced_done'`
- Mostra estado real: `Estado: {setupStatus}`
- Não esconde informações

### 📌 Cheiros de Problema Encontrados

#### 🟡 Cards com Status "active" mas sem Path
**Evidência:**
```typescript
// DashboardZero.tsx:283-301
if (module.status !== 'active' || !module.path) {
  // Redireciona para coming-soon
}
```
**Problema:** Se `status === 'active'` mas `path` é `null`, card parece ativo mas não funciona.

**Recomendação:** Validar que `status === 'active'` implica `path !== null`.

### ✔️ Melhor remover do que prometer
**Status:** 🟢 **IMPLEMENTADO**

**Evidência:**
- Módulos inativos redirecionam para "coming soon" (não quebram)
- Badges de status são visíveis
- Não há botões que quebram silenciosamente

---

## 🧠 5. AUDITORIA DE SOBERANIA (Quem manda em quem)

### ❓ O que foi verificado
- Usuário mandando mais que o sistema
- Sistema confiando demais no usuário
- Overrides silenciosos

### 🔎 Checklist

#### ✅ FOE decide existência, não o usuário
**Status:** 🟢 **IMPLEMENTADO**

**Evidência:**
- `FlowGate.tsx` - Autoridade única de navegação
- `CoreFlow.ts` - Função pura determinística
- Usuário não pode burlar guards via UI

#### ⚠️ Activation decide operação, não a UI
**Status:** 🟡 **PARCIALMENTE IMPLEMENTADO**

**Evidência:**
- `RequireActivation.tsx` - Guard verifica `operation_mode`
- **Problema:** Guard pode ser bypassado via URL (`?skip_activation=true`)
- **Risco:** Em produção, usuário pode bypassar activation

**Recomendação:** Restringir bypass a `NODE_ENV === 'development'`.

#### ✅ Dashboard obedece configuração
**Status:** 🟢 **IMPLEMENTADO**

**Evidência:**
- `DashboardZero.tsx:86-100` - Verifica `operation_mode` antes de renderizar
- `SystemStatusLine` mostra estado real do sistema
- Não permite ações sem configuração correta

#### ⚠️ Nenhum botão "quebra" a arquitetura
**Status:** 🟡 **MAIORIA PROTEGIDA**

**Evidência:**
- `DashboardZero.tsx:133-147` - `handleNavigate` usa `window.open` para tools
- **Problema:** `window.open` pode ser bloqueado por popup blockers
- **Risco:** Se bloqueado, ação falha silenciosamente

**Recomendação:** Adicionar fallback se `window.open` retornar `null`.

### 📌 Cheiros de Problema Encontrados

#### 🔴 Bypass Exposto em Produção
```typescript
// RequireActivation.tsx:30
if (urlParams.get('skip_activation')) {
  setIsVerified(true); // ⚠️ Disponível em produção
}
```
**Risco:** Usuário pode bypassar activation em produção.

#### 🟡 window.open Sem Fallback
```typescript
// DashboardZero.tsx:142
window.open(path, '_blank', 'noopener,noreferrer');
// ⚠️ Se bloqueado, retorna null mas não trata
```
**Risco:** Ação falha silenciosamente se popup bloqueado.

### ✔️ Usuário escolhe dentro do ritual, não fora
**Status:** 🟡 **MAIORIA IMPLEMENTADA**

**Problema:** Bypass de dev exposto permite escolha fora do ritual.

---

## 🔐 6. AUDITORIA DE SEGURANÇA LÓGICA (Sem Auth ainda)

### ❓ O que foi verificado
- Paths acessíveis via URL
- Flags burláveis via DevTools
- window.open abrindo coisa errada

### 🔎 Checklist

#### ⚠️ Todos os /app/* passam por guard
**Status:** 🟡 **MAIORIA PROTEGIDA**

**Evidência:**
- `App.tsx:151-262` - Rotas `/app/*` envolvidas em `<RequireActivation>`
- `FlowGate.tsx` - Verifica antes de permitir acesso
- **Problema:** `/app/coming-soon` não tem guard específico (mas é página informativa)

**Rotas Protegidas:**
- ✅ `/app/dashboard` - RequireActivation
- ✅ `/app/tpv` - RequireActivation
- ✅ `/app/kds` - RequireActivation
- ✅ `/app/menu` - RequireActivation
- ⚠️ `/app/coming-soon` - Sem guard (mas é página informativa)

#### ⚠️ Nenhum módulo confia só no frontend
**Status:** 🟡 **MAIORIA PROTEGIDA**

**Evidência:**
- `RequireActivation.tsx:44-56` - Fallback para DB se localStorage vazio
- **Problema:** Se `localOpMode` existe, permite acesso SEM verificar DB
- **Risco:** Frontend pode burlar se localStorage for manipulado

**Exemplo:**
```typescript
// RequireActivation.tsx:38-42
const localOpMode = getTabIsolated('chefiapp_operation_mode');
if (localOpMode) {
  setIsVerified(true); // ⚠️ Não verifica DB
  return;
}
```

**Recomendação:** Sempre verificar DB, usar localStorage apenas como cache.

#### 🔴 skip_activation só existe em dev
**Status:** 🔴 **NÃO IMPLEMENTADO**

**Evidência:**
- `RequireActivation.tsx:30` - Bypass disponível via URL
- **Problema:** Não verifica `NODE_ENV`
- **Risco:** Bypass disponível em produção

**Recomendação:**
```typescript
if (urlParams.get('skip_activation') && import.meta.env.DEV) {
  setIsVerified(true);
  return;
}
```

#### ✅ window.open só abre ferramentas autorizadas
**Status:** 🟢 **PROTEGIDO**

**Evidência:**
- `DashboardZero.tsx:137-143` - Lista explícita de rotas permitidas
- `toolRoutes = ['/app/tpv', '/app/kds', '/app/menu', '/app/orders', '/app/staff']`
- Apenas rotas autorizadas abrem em nova aba

### 📌 Cheiros de Problema Encontrados

#### 🔴 Bypass de Dev em Produção
```typescript
// RequireActivation.tsx:30
if (urlParams.get('skip_activation')) {
  // ⚠️ Não verifica NODE_ENV
}
```
**Risco:** Bypass disponível em produção.

#### 🟡 Frontend como Fonte de Verdade
```typescript
// RequireActivation.tsx:38-42
if (localOpMode) {
  setIsVerified(true); // ⚠️ Não verifica DB
}
```
**Risco:** localStorage pode ser manipulado.

### ✔️ Segurança Lógica
**Status:** 🟡 **MAIORIA PROTEGIDA, MAS COM FALHAS**

**Problemas Críticos:**
1. Bypass de dev exposto em produção
2. Frontend confia em localStorage sem verificar DB

---

## 🧭 7. AUDITORIA DE FUTURO (O que vai doer depois)

### ❓ O que foi verificado
- Coisas difíceis de migrar
- Decisões irreversíveis
- Acoplamento silencioso

### 🔎 Checklist

#### ⚠️ Dá pra trocar Supabase sem reescrever tudo?
**Status:** 🟡 **PARCIALMENTE ACOPLADO**

**Evidência:**
- `supabase` importado diretamente em muitos lugares
- `useSupabaseAuth.ts` - Hook específico do Supabase
- **Problema:** Não há camada de abstração

**Exemplo de Acoplamento:**
```typescript
// FlowGate.tsx:86-89
const { data: members, error: memberError } = await supabase
  .from('gm_restaurant_members')
  .select('restaurant_id, role')
  .eq('user_id', session.user.id);
```

**Recomendação:** Criar camada de abstração (Repository pattern) para queries.

#### ✅ Activation suporta novos modos?
**Status:** 🟢 **EXTENSÍVEL**

**Evidência:**
- `ActivationPage.tsx:16-19` - Configuração via estado
- Enum `operation_mode` pode ser estendido
- **Observação:** Valores verificados precisam ser atualizados também

#### ⚠️ Device roles escalam?
**Status:** 🟡 **LIMITADO**

**Evidência:**
- `device_role` armazenado em localStorage
- `useDevicePermissions.ts` - Lógica de permissões baseada em role
- **Problema:** Não há validação contra DB
- **Risco:** Novos roles podem não ser validados

**Recomendação:** Mover `device_role` para DB e validar contra `user.role`.

#### ⚠️ Multi-restaurante já está implícito?
**Status:** 🟢 **IMPLEMENTADO**

**Evidência:**
- `TenantResolver.ts` - Resolução de tenant
- `TenantContext.tsx` - Context para tenant atual
- `FlowGate.tsx:230-239` - Resolução de tenant para `/app/*`
- **Observação:** Sistema já suporta multi-tenant

### 📌 Cheiros de Problema Encontrados

#### 🔴 Acoplamento com Supabase
```typescript
// Muitos lugares importam supabase diretamente
import { supabase } from '../../core/supabase';
```
**Risco:** Difícil migrar para outro provider.

#### 🟡 Estado em localStorage
```typescript
// device_role, operation_mode em localStorage
// Não sincronizado com DB
```
**Risco:** Dificulta migração e sincronização multi-device.

### ✔️ "Isso nunca vai mudar..." → Vai
**Status:** 🟡 **ALGUNS ACOPLAMENTOS IDENTIFICADOS**

**Acoplamentos Críticos:**
1. Supabase direto (sem abstração)
2. Estado em localStorage (não sincronizado)
3. Valores hardcoded (operation_mode)

---

## 🧠 VEREDITO HONESTO (ATUAL)

### 📊 Resumo Executivo

O sistema está:
- 🟢 **Arquiteturalmente forte** - FlowGate como autoridade única, guards centralizados
- 🟡 **Semanticamente inchado** - Alguns campos sem contrato claro (setup_status, operation_mode)
- 🟡 **Com risco de flags zumbis** - LocalStorage pode divergir de DB
- 🟢 **UX muito acima da média** - UI honesta, "coming soon" explícito
- 🔴 **Precisando matar coisas antigas** - Bypass de dev exposto, acoplamento com Supabase

### 🎯 Pontos Fortes

1. **FlowGate como Autoridade Única** ✅
   - Navegação centralizada e determinística
   - Guards bem implementados
   - Função pura `resolveNextRoute`

2. **UX Honesta** ✅
   - "Coming soon" explícito
   - Badges de status visíveis
   - Não promete o que não entrega

3. **Multi-Tenant** ✅
   - Sistema já suporta multi-restaurante
   - Tenant resolution funcional

### 🔴 Pontos Críticos

1. **Bypass de Dev em Produção** 🔴
   - `?skip_activation=true` disponível em produção
   - **Ação:** Restringir a `NODE_ENV === 'development'`

2. **LocalStorage como Fonte de Verdade** 🔴
   - `RequireActivation` permite acesso baseado apenas em localStorage
   - **Ação:** Sempre verificar DB primeiro, localStorage como cache

3. **Acoplamento com Supabase** 🟡
   - Muitos imports diretos
   - **Ação:** Criar camada de abstração (Repository pattern)

### 🟡 Pontos de Atenção

1. **Semântica Confusa** 🟡
   - `setup_status` hierarquia não clara
   - `operation_mode` valores inconsistentes
   - **Ação:** Documentar contratos semânticos

2. **Guards Duplicados** 🟡
   - `RequireActivation` e `DashboardZero` verificam `operation_mode`
   - **Ação:** Consolidar (não crítico)

3. **Estado em localStorage** 🟡
   - `device_role`, `operation_mode` não sincronizados com DB
   - **Ação:** Mover para DB ou sincronizar

### ✅ Isso é ótimo sinal

Significa que já dá pra podar, não construir.

**Próximos Passos Recomendados:**
1. 🔴 **URGENTE:** Restringir bypass de dev a produção
2. 🔴 **URGENTE:** Sempre verificar DB antes de localStorage
3. 🟡 **MÉDIO:** Documentar contratos semânticos
4. 🟡 **MÉDIO:** Criar camada de abstração para Supabase
5. 🟢 **BAIXO:** Consolidar guards duplicados

---

## 📋 CHECKLIST DE AÇÕES

### 🔴 Crítico (Fazer Agora)
- [ ] Restringir `?skip_activation` a `NODE_ENV === 'development'`
- [ ] Sempre verificar DB antes de confiar em localStorage
- [ ] Adicionar validação de `device_role` contra `user.role` do DB

### 🟡 Importante (Fazer em Breve)
- [ ] Documentar contrato semântico de `setup_status`
- [ ] Corrigir inconsistência de `operation_mode` (valores configuráveis vs verificados)
- [ ] Criar camada de abstração para queries do Supabase
- [ ] Consolidar guards duplicados (RequireActivation + DashboardZero)

### 🟢 Melhoria (Fazer Quando Possível)
- [ ] Adicionar fallback se `window.open` retornar `null`
- [ ] Mover `device_role` e `operation_mode` para DB
- [ ] Adicionar timestamp `advanced_completed_at` similar a `onboarding_completed_at`

---

**Fim da Auditoria**
