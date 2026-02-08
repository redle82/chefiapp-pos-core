# 🔍 DEBUG: Criação Automática de Restaurante

**Data:** 27/01/2026  
**Problema:** Criação automática não está funcionando

---

## 🔍 LOGS ADICIONADOS

Agora o código mostra logs detalhados em cada etapa:

1. `[IdentitySection] Tentando criar restaurante automaticamente...`
2. `[IdentitySection] Verificando autenticação...`
3. `[IdentitySection] Usuário autenticado: [id]`
4. `[IdentitySection] Criando restaurante...`
5. `[IdentitySection] ✅ Restaurante criado: [id]` ou erro

---

## 🚨 POSSÍVEIS PROBLEMAS

### 1. Usuário não autenticado
**Sintoma:** `Usuário não autenticado. Não é possível criar restaurante.`

**Solução:** Fazer login primeiro

### 2. Erro ao criar restaurante
**Sintoma:** `Erro ao criar restaurante: [detalhes]`

**Possíveis causas:**
- Colunas não existem (migration não executada)
- Políticas RLS bloqueando
- Dados inválidos

**Solução:** Verificar mensagem de erro específica

### 3. Timeout não executando
**Sintoma:** Nenhum log aparece

**Solução:** Verificar se `isValid` está `true` e `formData.name` existe

---

## 🧪 TESTE PASSO A PASSO

1. **Abra o console** (F12)

2. **Limpe localStorage:**
   ```javascript
   localStorage.removeItem('chefiapp_restaurant_id');
   ```

3. **Preencha a seção Identity:**
   - Nome: "Teste Restaurante"
   - Tipo: Restaurante
   - País: Brasil
   - Fuso: America/Sao_Paulo
   - Moeda: BRL
   - Idioma: pt-BR

4. **Observe os logs no console:**
   - Deve aparecer: `[IdentitySection] Tentando criar restaurante automaticamente...`
   - Depois: `[IdentitySection] Verificando autenticação...`
   - E assim por diante...

5. **Se aparecer erro:**
   - Copie a mensagem de erro completa
   - Verifique se está autenticado
   - Verifique se a migration foi executada

---

## 📋 CHECKLIST

- [ ] Console mostra `[IdentitySection] Tentando criar restaurante automaticamente...`?
- [ ] Console mostra `[IdentitySection] Usuário autenticado: [id]`?
- [ ] Console mostra `[IdentitySection] Criando restaurante...`?
- [ ] Há algum erro no console?
- [ ] Está autenticado? (verificar seção de autenticação)

---

**Status:** 🔍 **AGUARDANDO LOGS DO CONSOLE**
