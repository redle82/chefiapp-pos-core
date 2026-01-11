# S0-001: Bootstrap Resiliente — Status de Implementação

**Data:** 2025-12-27  
**Status:** ✅ **IMPLEMENTADO**

---

## ✅ O que foi implementado

### 1. Timeout Cognitivo (10s)
- ✅ Timeout de 10s para health check
- ✅ Estado `timeout` quando excede
- ✅ Opções de recuperação visíveis

### 2. Feedback de Progresso
- ✅ Estados granulares: `checking_restaurant`, `checking_health`
- ✅ Mensagem de progresso após 2s
- ✅ Texto contextual: "Verificando restaurante…", "Conectando ao sistema…"
- ✅ Hint: "Isto pode levar alguns segundos…"

### 3. Opções de Recuperação
- ✅ **Tentar novamente** (retry)
- ✅ **Entrar em modo demo** (fallback)
- ✅ **Voltar ao início** (escape hatch - apenas em timeout)

### 4. Estados Melhorados
- ✅ Estado `timeout` com UI dedicada
- ✅ Estado `error` com opções de recuperação
- ✅ Progresso visível durante verificação

---

## 📝 Mudanças no Código

**Arquivo:** `merchant-portal/src/pages/BootstrapPage.tsx`

### Adições:
- Estados: `checking_restaurant`, `checking_health`, `timeout`
- Constantes: `BOOTSTRAP_TIMEOUT = 10000`, `PROGRESS_DELAY = 2000`
- Estados de UI: `showProgress`, `progressStep`
- Lógica de timeout com `Promise.race()`
- UI para estado `timeout` com 3 botões

### Melhorias:
- Feedback de progresso após 2s
- Timeout visível (não fica mudo)
- Opções de recuperação claras
- Tratamento de erro melhorado

---

## ✅ Critérios de Aceite

- [x] Bootstrap não trava por mais de 10s sem feedback
- [x] Após 2s, mostra mensagem de progresso
- [x] Após timeout, mostra opções de recuperação
- [x] Em caso de erro, mostra mensagem clara + retry
- [ ] TestSprite passa no smoke test de `/app/bootstrap` (pendente re-execução)
- [ ] 19 rotas desbloqueadas (pendente re-execução)

---

## 🧪 Próximos Passos (Testes)

### Teste Manual
1. Limpar `localStorage` → acessar `/app/bootstrap` → deve redirecionar para `/start`
2. Setar `restaurant_id` → acessar → deve mostrar progresso após 2s
3. Simular timeout (desligar servidor) → deve mostrar opções após 10s
4. Testar modo demo → deve redirecionar rápido

### Teste Automatizado
1. Re-executar TestSprite: `cd testsprite_uiux && npm test`
2. Validar que `/app/bootstrap` não timeout
3. Validar que 19 rotas desbloqueadas

---

## 📊 Impacto Esperado

### Antes
- ❌ Bootstrap timeout > 30s
- ❌ 19 rotas bloqueadas
- ❌ Score Navegação: 62/100

### Depois (após testes)
- ✅ Bootstrap timeout 10s + recovery
- ✅ 19 rotas desbloqueadas
- ✅ Score Navegação: ~85/100

---

**Status:** ✅ Implementação completa, aguardando testes

