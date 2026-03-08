# Guia de Validação Visual Completa - ChefIApp

**Objetivo:** Ver todo o sistema funcionando em tempo real, com um pedido criado em um ponto e refletido corretamente em todos os periféricos.

---

## 🎯 Cenário Único de Teste

Criar **UM pedido** a partir de **UM único ponto** (TPV web OU iOS) e validar que ele aparece corretamente em:
- ✅ TPV (Web)
- ✅ KDS (Web)
- ✅ Dashboard de Observabilidade
- ✅ iOS Simulator (Garçom)
- ✅ Android Emulator (Cozinha)

---

## 🚀 Passo 1: Preparar Ambiente

### 1.1 Verificar Supabase Local

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
supabase status
```

Se não estiver rodando:
```bash
supabase start
```

### 1.2 Verificar/Criar Restaurante Piloto

```bash
npx ts-node scripts/setup-pilot-restaurant.ts
```

---

## 🚀 Passo 2: Subir Todos os Pontos de Visualização

### Opção A: Script Automatizado (Recomendado)

```bash
./scripts/visual-validation-orchestrator.sh
```

Isso vai:
- ✅ Verificar ambiente
- ✅ Criar restaurante se necessário
- ✅ Iniciar Merchant Portal
- ✅ Mostrar URLs de acesso

### Opção B: Manual

#### 2.1 Merchant Portal (Web)

```bash
cd merchant-portal
npm run dev
```

**URLs esperadas:**
- Dashboard: http://localhost:5173/app/dashboard
- TPV: http://localhost:5173/app/tpv
- KDS: http://localhost:5173/app/kds/{restaurantId}

#### 2.2 Mobile App - iOS

```bash
cd mobile-app
npx expo run:ios
```

**Ações:**
1. Abrir simulador iOS
2. Logar como garçom
3. Abrir tela de mesas/pedidos

#### 2.3 Mobile App - Android

```bash
cd mobile-app
npx expo run:android
```

**Ações:**
1. Abrir emulador Android
2. Logar como cozinha
3. Abrir tela de pedidos ativos

---

## 🧪 Passo 3: Executar Teste Automatizado

```bash
./scripts/visual-validation-test.sh
```

Este script vai:
1. ✅ Obter mesa livre e produtos
2. ✅ Limpar pedidos abertos na mesa
3. ✅ Criar pedido via RPC `create_order_atomic`
4. ✅ Validar pedido no banco
5. ✅ Testar constraint (tentar criar segundo pedido na mesma mesa)

---

## ✅ Passo 4: Validação Visual Manual

Após executar o teste automatizado, verifique **visualmente** em cada ponto:

### 4.1 TPV (Web)

**URL:** http://localhost:5173/app/tpv

**Verificar:**
- ✅ Pedido aparece como ativo
- ✅ Mesa marcada como ocupada
- ✅ Itens do pedido visíveis
- ✅ Total correto

### 4.2 KDS (Web)

**URL:** http://localhost:5173/app/kds/{restaurantId}

**Verificar:**
- ✅ Pedido aparece em **< 2 segundos** (Realtime)
- ✅ Status inicial correto (NEW ou PREPARING)
- ✅ Itens do pedido visíveis
- ✅ Permite avançar status (PREPARING → READY)

### 4.3 Dashboard

**URL:** http://localhost:5173/app/dashboard

**Verificar:**
- ✅ Nenhum erro ativo
- ✅ ActiveIssuesWidget mostra estado saudável
- ✅ Pedidos ativos contabilizados corretamente
- ✅ Mesas ocupadas contabilizadas corretamente

### 4.4 iOS (Garçom)

**Verificar:**
- ✅ Pedido visível na lista de pedidos
- ✅ Mesa marcada como ocupada
- ✅ **NÃO permite** criar novo pedido na mesma mesa
- ✅ Mensagem clara se tentar criar segundo pedido

### 4.5 Android (Cozinha)

**Verificar:**
- ✅ Pedido aparece na lista
- ✅ Permite avançar status
- ✅ Status sincroniza em tempo real

---

## 🔒 Passo 5: Teste de Regra Constitucional

### 5.1 Tentar Criar Segundo Pedido na Mesma Mesa

**Ação:**
1. No TPV ou iOS, tentar criar outro pedido na mesa que já tem pedido aberto

**Esperado:**
- ❌ **Falha** (pedido não é criado)
- ✅ **Mensagem clara**: "Esta mesa já possui um pedido aberto. Feche ou pague o pedido existente antes de criar um novo."
- ❌ **Nenhum dado corrompido**
- ❌ **Nenhum crash**
- ❌ **Nenhum pedido duplicado**

**Validação no Banco:**
```sql
SELECT COUNT(*) 
FROM gm_orders 
WHERE table_id = '{table_id}' 
  AND status = 'OPEN';
-- Deve retornar: 1
```

---

## 🧹 Passo 6: Teste de Encerramento

### 6.1 Finalizar Pedido

**Ação:**
1. No TPV, finalizar o pedido (fechar/pagar)

**Esperado:**
- ✅ Mesa fica livre
- ✅ Dashboard atualiza estado
- ✅ Nenhuma tarefa pendente bloqueante
- ✅ Agora é possível criar novo pedido na mesma mesa

---

## 🛑 Se Algo Falhar

### Diagnóstico

**Não tente consertar imediatamente.** Primeiro, identifique:

1. **Qual camada falhou?**
   - UI (React/Expo)
   - RPC (create_order_atomic)
   - DB (PostgreSQL)
   - Estado (Realtime)

2. **Qual regra foi violada?**
   - Constraint de banco?
   - Regra de negócio?
   - Validação de UI?

3. **Qual assert não foi respeitado?**
   - Pedido não apareceu?
   - Apareceu duplicado?
   - Status incorreto?

### Informações para Debug

```bash
# Ver pedidos no banco
npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU', { auth: { persistSession: false } });
supabase.from('gm_orders').select('*').order('created_at', { ascending: false }).limit(5).then(({ data, error }) => {
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);
});
"

# Ver logs do Merchant Portal
tail -f /tmp/merchant-portal.log

# Verificar Realtime
# Abra DevTools no navegador e verifique conexão WebSocket
```

---

## 📋 Checklist de Validação Completa

### Ambiente
- [ ] Supabase local rodando
- [ ] Migrations aplicadas
- [ ] Restaurante piloto criado
- [ ] Merchant Portal rodando (porta 5173)
- [ ] iOS Simulator rodando (opcional)
- [ ] Android Emulator rodando (opcional)

### Teste Automatizado
- [ ] Script executado com sucesso
- [ ] Pedido criado no banco
- [ ] Constraint testada e funcionou

### Validação Visual - TPV
- [ ] Pedido aparece como ativo
- [ ] Mesa marcada como ocupada
- [ ] Itens visíveis
- [ ] Total correto

### Validação Visual - KDS
- [ ] Pedido aparece em < 2s
- [ ] Status inicial correto
- [ ] Permite avançar status

### Validação Visual - Dashboard
- [ ] Nenhum erro ativo
- [ ] Estado saudável
- [ ] Métricas corretas

### Validação Visual - Mobile (se rodando)
- [ ] Pedido visível
- [ ] Constraint respeitada
- [ ] Sincronização em tempo real

### Teste de Constraint
- [ ] Segundo pedido bloqueado
- [ ] Mensagem clara exibida
- [ ] Nenhum dado corrompido

### Teste de Encerramento
- [ ] Mesa fica livre
- [ ] Dashboard atualiza
- [ ] Novo pedido possível

---

## 🎯 Princípio Final

**Não queremos "parece que funciona".**

Queremos ver o sistema inteiro reagindo ao mesmo evento, com:
- 🏛️ **Banco como juiz**
- ⚖️ **Core como lei**
- 👁️ **UI como espelho**

Execute isso com disciplina. Mostre tudo. Nada de esconder estado.

---

## 📝 Próximos Passos

Após validação visual completa:

1. **Documentar resultados** em `docs/pilots/VISUAL_VALIDATION_RESULTS.md`
2. **Identificar gaps** de UX (sem mudar regras)
3. **Preparar para piloto real** de 7 dias

---

*"O sistema não mente. O banco não passa pano. O Core não adivinha intenção."*
