**Status:** ARCHIVED
**Reason:** Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)
**Arquivado em:** 2026-01-28

---

# 🔧 FIX: Restaurant ID Missing no Onboarding

**Data:** 27/01/2026  
**Problema:** `[IdentitySection] Dados válidos mas sem restaurantId. Aguardando...`

---

## 🔍 PROBLEMA IDENTIFICADO

O log mostra que:
- ✅ Dados do formulário estão válidos
- ❌ `restaurantId` não está disponível

**Causa:** O restaurante ainda não foi criado. Normalmente isso acontece via `/bootstrap`, mas o usuário pode ter acessado `/onboarding` diretamente.

---

## ✅ SOLUÇÃO IMPLEMENTADA

Agora a **IdentitySection** cria o restaurante automaticamente quando:
1. Dados estão válidos
2. `restaurantId` não existe
3. Usuário está autenticado

**Fluxo:**
1. Usuário preenche Identity
2. Sistema detecta que não tem `restaurantId`
3. Cria restaurante automaticamente com os dados preenchidos
4. Salva `restaurantId` no localStorage
5. Atualiza o restaurante com todos os dados

---

## 🧪 COMO TESTAR

1. **Limpe o localStorage:**
   ```javascript
   localStorage.removeItem('chefiapp_restaurant_id');
   ```

2. **Acesse `/onboarding` diretamente** (sem passar por `/bootstrap`)

3. **Preencha a seção Identity:**
   - Nome do restaurante
   - Tipo
   - País
   - Fuso horário
   - Moeda
   - Idioma

4. **Observe o console:**
   - Deve aparecer: `[IdentitySection] ✅ Restaurante criado: [id]`
   - Depois: `[IdentitySection] ✅ Identidade salva no banco`

---

## ⚠️ IMPORTANTE

- O restaurante é criado com `status: 'draft'` (não ativo)
- Só será ativado quando clicar em "Publicar"
- Se já existir um restaurante, não cria duplicado

---

**Status:** ✅ **IMPLEMENTADO**
