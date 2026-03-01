# 🔒 ROTAS BLOQUEADAS ATÉ ONBOARDING COMPLETO

## 📋 Resumo

Todas as rotas principais do ChefIApp estão **protegidas** e requerem onboarding completo antes de acessar.

**Exceção:** A rota `/onboarding` é sempre acessível (para permitir configuração inicial).

---

## ✅ ROTAS SEM PROTEÇÃO (Sempre Acessíveis)

### Onboarding
- `/onboarding` - Setup Tree principal
- `/onboarding?section=identity` - Seção de identidade
- `/onboarding?section=location` - Seção de localização
- `/onboarding?section=schedule` - Seção de horários
- `/onboarding?section=menu` - Seção de cardápio
- `/onboarding?section=inventory` - Seção de estoque
- `/onboarding?section=people` - Seção de pessoas
- `/onboarding?section=payments` - Seção de pagamentos
- `/onboarding?section=integrations` - Seção de integrações
- `/onboarding?section=publish` - Seção de publicação

### Rotas Legadas (Mantidas para compatibilidade)
- `/kds-minimal`
- `/public/:slug`
- `/menu-builder`
- `/operacao`
- `/inventory-stock`
- `/task-system`
- `/shopping-list`
- `/tpv`
- `/garcom`

---

## 🔒 ROTAS PROTEGIDAS (Requerem Onboarding Completo)

### Funcionário (Employee)
- ❌ `/employee/home` → Redireciona para `/onboarding`
- ❌ `/employee/tasks` → Redireciona para `/onboarding`
- ❌ `/employee/operation` → Redireciona para `/onboarding`
- ❌ `/employee/operation/kitchen` → Redireciona para `/onboarding`
- ❌ `/employee/mentor` → Redireciona para `/onboarding`

### Gerente (Manager)
- ❌ `/manager/dashboard` → Redireciona para `/onboarding`
- ❌ `/manager/central` → Redireciona para `/onboarding`
- ❌ `/manager/analysis` → Redireciona para `/onboarding`
- ❌ `/manager/schedule` → Redireciona para `/onboarding`
- ❌ `/manager/schedule/create` → Redireciona para `/onboarding`
- ❌ `/manager/reservations` → Redireciona para `/onboarding`

### Dono (Owner)
- ❌ `/owner/vision` → Redireciona para `/onboarding`
- ❌ `/owner/stock` → Redireciona para `/onboarding`
- ❌ `/owner/simulation` → Redireciona para `/onboarding`
- ❌ `/owner/purchases` → Redireciona para `/onboarding`

---

## 🎯 LÓGICA DE PROTEÇÃO

### Componente: `RequireOnboarding`

**Arquivo:** `merchant-portal/src/components/onboarding/RequireOnboarding.tsx`

**Como funciona:**
1. Verifica se onboarding está completo
2. Se não completo → redireciona para `/onboarding`
3. Se completo → permite acesso à rota

**Critério de "Completo":**
- Todas as seções obrigatórias com status `COMPLETE`:
  - ✅ Identidade
  - ✅ Localização
  - ✅ Horários
  - ✅ Cardápio
  - ✅ Pessoas

**Verificação:**
- Por enquanto: localStorage (`chefiapp_onboarding_state`)
- Futuro: Banco de dados (campo `restaurant.status = 'ACTIVE'`)

---

## 🔄 FLUXO DE USUÁRIO

### Primeira Vez (Sem Onboarding)
1. Usuário acessa `/owner/vision`
2. `RequireOnboarding` detecta: onboarding incompleto
3. Redireciona para `/onboarding`
4. Usuário completa setup
5. Clica "Publicar Restaurante"
6. Sistema marca onboarding como completo
7. Redireciona para `/owner/vision` (agora acessível)

### Após Onboarding Completo
1. Usuário acessa qualquer rota protegida
2. `RequireOnboarding` detecta: onboarding completo
3. Permite acesso normalmente

---

## 🧪 TESTE DE VALIDAÇÃO

### Cenário 1: Acesso sem Onboarding
```bash
# Limpar localStorage
localStorage.removeItem('chefiapp_onboarding_state')

# Acessar rota protegida
http://localhost:5175/owner/vision

# Resultado esperado: Redireciona para /onboarding
```

### Cenário 2: Acesso com Onboarding Completo
```bash
# Completar onboarding (via UI)
# Clicar "Publicar Restaurante"

# Acessar rota protegida
http://localhost:5175/owner/vision

# Resultado esperado: Acesso permitido
```

---

## 📝 PRÓXIMOS PASSOS

### Integração com Banco de Dados
- [ ] Criar tabela `restaurant_setup_status`
- [ ] Salvar status no banco ao completar seção
- [ ] Verificar status do banco em `RequireOnboarding`
- [ ] Marcar `restaurant.status = 'ACTIVE'` ao publicar

### Melhorias UX
- [ ] Mensagem clara ao redirecionar: "Complete o setup primeiro"
- [ ] Preservar rota original para redirecionar depois
- [ ] Mostrar progresso do onboarding na mensagem

---

**Documento criado em:** 27/01/2026  
**Status:** ✅ Implementado
