**Status:** ARCHIVED  
**Reason:** Documento histórico; estado atual documentado em STATE_PURE_DOCKER_APP_LAYER.md e ESTADO_ATUAL_2026_01_28.md  
**Arquivado em:** 2026-01-28

---

# ✅ CHECKLIST: Debug do Onboarding

**Data:** 27/01/2026

---

## 🔍 PASSO A PASSO PARA IDENTIFICAR O PROBLEMA

### 1️⃣ Abra o Console
- Pressione **F12** (ou Cmd+Option+I no Mac)
- Vá para a aba **"Console"**

### 2️⃣ Limpe o Console
- Clique no ícone de limpar (🚫) ou pressione `Ctrl+L`

### 3️⃣ Preencha a Seção Identity
Preencha todos os campos:
- ✅ Nome do restaurante (mín. 3 caracteres)
- ✅ Tipo de estabelecimento
- ✅ País
- ✅ Fuso horário
- ✅ Moeda
- ✅ Idioma

### 4️⃣ Observe os Logs

Você deve ver esta sequência:

```
[IdentitySection] Estado atual: { isValid: true, restaurantId: '❌ Não existe', ... }
[IdentitySection] 🚀 Tentando criar restaurante automaticamente...
[IdentitySection] Verificando autenticação...
[IdentitySection] Usuário autenticado: [id]
[IdentitySection] Criando restaurante...
[IdentitySection] ✅ Restaurante criado: [id]
```

---

## 🚨 SE NÃO APARECER NENHUM LOG

**Problema:** O código não está sendo executado

**Possíveis causas:**
1. Componente não está montando
2. `useEffect` não está rodando
3. Dados não estão válidos

**Solução:** Verificar se o componente está renderizando

---

## 🚨 SE APARECER "Usuário não autenticado"

**Problema:** Não está logado

**Solução:** Fazer login primeiro

---

## 🚨 SE APARECER ERRO AO CRIAR RESTAURANTE

**Problema:** Erro no banco de dados

**Possíveis causas:**
1. Migration não executada (colunas não existem)
2. Políticas RLS bloqueando
3. Dados inválidos

**Solução:** Verificar mensagem de erro específica

---

## 📋 INFORMAÇÕES PARA REPORTAR

Quando reportar o problema, inclua:

1. **Todos os logs do console** (copie e cole)
2. **Mensagem de erro** (se houver)
3. **Se está autenticado** (verificar seção de auth)
4. **Se a migration foi executada** (verificar banco)

---

**Status:** 🔍 **AGUARDANDO LOGS DO CONSOLE**
