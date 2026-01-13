# 🎯 SPLIT BILL VIA QR CODE - MVP

**Data:** 2026-01-20  
**Objetivo:** Permitir que clientes dividam e paguem conta via QR Code na mesa  
**Fase:** MVP (Recorte Seguro e Controlado)

---

## 🎯 RECORTE MVP (O QUE ENTRA AGORA)

### ✅ **O QUE FAZ PARTE DO MVP**

1. **Split iniciado pelo garçom**
   - Garçom clica em "Dividir Conta" no TPV
   - Sistema entra em modo `SPLIT_IN_PROGRESS`
   - QR Code da mesa vira "convite de pagamento"

2. **Cliente acessa via QR**
   - Escaneia QR Code na mesa
   - Vê apenas sua parte da conta
   - Escolhe método de pagamento
   - Paga sua parte

3. **Split por partes iguais apenas**
   - Sistema calcula valor por pessoa
   - Ajusta cêntimos no último pagamento
   - Sem split por item (isso fica para Fase 2)

4. **Controle total do garçom**
   - Garçom vê estado em tempo real no TPV
   - Pode intervir a qualquer momento
   - Pode finalizar manualmente se necessário

5. **Encerramento automático**
   - Quando saldo == 0, conta fecha automaticamente
   - Se faltar saldo, alerta visual para garçom

---

### ❌ **O QUE FICA FORA DO MVP**

- Split por item (Fase 2)
- Cliente iniciar split sozinho (Fase 2)
- Gorjeta individual (Fase 2)
- Escolha de pagar mais/menos (Fase 2)
- Fidelidade individual (Fase 2)

---

## 🔄 FLUXO COMPLETO - PASSO A PASSO

### **FASE 1: Garçom Inicia Split**

#### **Tela do Garçom (TPV)**
```
┌─────────────────────────────────────┐
│  Mesa 5 - Conta Aberta              │
│  Total: €45,00                      │
│                                      │
│  [Dividir Conta] [Fechar e Pagar]   │
└─────────────────────────────────────┘
```

**Ação:** Garçom clica em "Dividir Conta"

#### **Modal de Split (TPV)**
```
┌─────────────────────────────────────┐
│  Dividir Conta - Mesa 5             │
│                                      │
│  Total: €45,00                      │
│                                      │
│  Quantas pessoas vão pagar?         │
│  [2] [3] [4] [5] [6]                │
│                                      │
│  Valor por pessoa: €15,00           │
│  (última pessoa: €15,00)            │
│                                      │
│  [Ativar QR Code] [Cancelar]        │
└─────────────────────────────────────┘
```

**Ação:** Garçom seleciona número de pessoas e clica em "Ativar QR Code"

#### **Estado da Mesa (TPV)**
```
┌─────────────────────────────────────┐
│  Mesa 5 - DIVISÃO EM ANDAMENTO      │
│  Total: €45,00                      │
│  Já Pago: €0,00                     │
│  Saldo: €45,00                      │
│                                      │
│  Status: 0 de 3 pessoas pagaram    │
│                                      │
│  [Ver QR Code] [Finalizar Manual]   │
└─────────────────────────────────────┘
```

**QR Code gerado:** URL única para esta sessão de split

---

### **FASE 2: Cliente Acessa via QR**

#### **Tela do Cliente (Mobile Web)**
```
┌─────────────────────────────────────┐
│  Restaurante XYZ                    │
│  Mesa 5                             │
│                                      │
│  ┌─────────────────────────────┐    │
│  │  Conta em Divisão           │    │
│  │                             │    │
│  │  Sua parte: €15,00          │    │
│  │                             │    │
│  │  Total da conta: €45,00     │    │
│  │  3 pessoas                   │    │
│  │                             │    │
│  │  Status:                    │    │
│  │  • Pessoa 1: Pendente       │    │
│  │  • Pessoa 2: Pendente       │    │
│  │  • Pessoa 3: Pendente       │    │
│  └─────────────────────────────┘    │
│                                      │
│  [Pagar Minha Parte]                 │
└─────────────────────────────────────┘
```

**Ação:** Cliente clica em "Pagar Minha Parte"

#### **Tela de Pagamento (Mobile Web)**
```
┌─────────────────────────────────────┐
│  Pagar Minha Parte                  │
│                                      │
│  Valor: €15,00                      │
│                                      │
│  Método de Pagamento:               │
│  ○ Dinheiro                         │
│  ○ Cartão                           │
│  ○ PIX                              │
│                                      │
│  [Confirmar Pagamento]              │
└─────────────────────────────────────┘
```

**Ação:** Cliente seleciona método e confirma

#### **Confirmação (Mobile Web)**
```
┌─────────────────────────────────────┐
│  ✓ Pagamento Registrado!            │
│                                      │
│  Você pagou: €15,00                 │
│  Método: Cartão                      │
│                                      │
│  Status da conta:                   │
│  • Pessoa 1: ✓ Pago (você)         │
│  • Pessoa 2: Pendente               │
│  • Pessoa 3: Pendente               │
│                                      │
│  Saldo restante: €30,00             │
│                                      │
│  [Fechar]                           │
└─────────────────────────────────────┘
```

---

### **FASE 3: Atualização em Tempo Real**

#### **Tela do Garçom (TPV) - Atualizada**
```
┌─────────────────────────────────────┐
│  Mesa 5 - DIVISÃO EM ANDAMENTO      │
│  Total: €45,00                      │
│  Já Pago: €15,00                    │
│  Saldo: €30,00                      │
│                                      │
│  Status: 1 de 3 pessoas pagaram    │
│                                      │
│  ✓ Pessoa 1: Pago (Cartão)         │
│  ⏳ Pessoa 2: Pendente              │
│  ⏳ Pessoa 3: Pendente              │
│                                      │
│  [Ver QR Code] [Finalizar Manual]   │
└─────────────────────────────────────┘
```

**Atualização:** Em tempo real via WebSocket/Realtime

---

### **FASE 4: Encerramento**

#### **Quando Todos Pagam (Automático)**
```
┌─────────────────────────────────────┐
│  ✓ Mesa 5 - CONTA FECHADA           │
│                                      │
│  Total: €45,00                      │
│  Pago: €45,00                       │
│                                      │
│  ✓ Pessoa 1: Pago (Cartão)         │
│  ✓ Pessoa 2: Pago (PIX)            │
│  ✓ Pessoa 3: Pago (Dinheiro)       │
│                                      │
│  [Ver Detalhes]                     │
└─────────────────────────────────────┘
```

**Ação:** Mesa volta para "LIVRE" automaticamente

#### **Se Faltar Saldo (Alerta)**
```
┌─────────────────────────────────────┐
│  ⚠️ Mesa 5 - SALDO PENDENTE         │
│                                      │
│  Total: €45,00                      │
│  Pago: €30,00                       │
│  Saldo: €15,00                      │
│                                      │
│  Status: 2 de 3 pessoas pagaram     │
│                                      │
│  ⚠️ Faltam €15,00                   │
│  Fale com o garçom                  │
│                                      │
│  [Finalizar Manual]                 │
└─────────────────────────────────────┘
```

**Ação:** Garçom pode finalizar manualmente ou aguardar

---

## 🏗️ ARQUITETURA TÉCNICA

### **Componentes Necessários**

#### **1. Backend - Nova Rota**
```
POST /api/split/start
Body: { orderId, numberOfPeople }
Response: { splitId, qrCodeUrl, amountPerPerson }

GET /api/split/{splitId}/status
Response: { total, paid, remaining, peopleStatus[] }

POST /api/split/{splitId}/pay
Body: { personNumber, amount, method }
Response: { success, paymentId, remaining }
```

#### **2. Frontend TPV - Componentes**
- `SplitQRCodeModal.tsx` - Modal para gerar QR Code
- `SplitStatusPanel.tsx` - Painel de status em tempo real
- Atualizar `SplitBillModal.tsx` - Adicionar opção "Ativar QR Code"

#### **3. Frontend Cliente - Página Web**
- `SplitPaymentPage.tsx` - Página pública para pagamento
- Rota: `/split/{splitId}` ou `/split/{tableId}/{token}`

#### **4. QR Code**
- Gerar URL única: `https://chefiapp.com/split/{splitId}?token={secureToken}`
- Token expira após 1 hora ou quando conta fecha
- QR Code mostra URL encurtada (mais fácil de escanear)

---

## 🔐 REGRAS DE SEGURANÇA (OBRIGATÓRIAS)

### **1. Cliente NÃO Pode:**
- ❌ Alterar itens da conta
- ❌ Mudar valores
- ❌ Fechar conta se faltar saldo
- ❌ Ver dados de outros pagadores (apenas status)

### **2. Garçom SEMPRE Pode:**
- ✅ Intervir a qualquer momento
- ✅ Finalizar manualmente
- ✅ Cancelar split
- ✅ Ver todos os pagamentos

### **3. Sistema DEVE:**
- ✅ Validar que split está ativo antes de aceitar pagamento
- ✅ Validar que pessoa não pagou duas vezes
- ✅ Mostrar alerta se faltar saldo
- ✅ Não fechar conta automaticamente se faltar saldo

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### **Fase 1: Backend (2-3 dias)**
1. Criar tabela `gm_split_sessions`
2. Criar rotas API (`/api/split/*`)
3. Implementar lógica de split com QR
4. Adicionar validações de segurança

### **Fase 2: Frontend TPV (2 dias)**
1. Criar `SplitQRCodeModal.tsx`
2. Criar `SplitStatusPanel.tsx`
3. Atualizar `SplitBillModal.tsx`
4. Integrar com TPV existente

### **Fase 3: Frontend Cliente (2 dias)**
1. Criar página pública `/split/{splitId}`
2. Implementar fluxo de pagamento
3. Adicionar atualização em tempo real
4. Testar em mobile

### **Fase 4: Testes (1-2 dias)**
1. Testar fluxo completo
2. Testar segurança (tentativas de burlar)
3. Testar edge cases (timeout, múltiplos pagamentos)
4. Validar UX com usuários reais

**Total estimado:** 7-9 dias

---

## 🎯 CRITÉRIOS DE SUCESSO

### **Funcionalidade:**
- ✅ Garçom inicia split e gera QR Code
- ✅ Cliente acessa via QR e paga sua parte
- ✅ Status atualiza em tempo real
- ✅ Conta fecha automaticamente quando saldo == 0

### **Segurança:**
- ✅ Cliente não pode alterar valores
- ✅ Cliente não pode fechar conta se faltar saldo
- ✅ Garçom sempre pode intervir
- ✅ Token expira após 1 hora

### **UX:**
- ✅ Fluxo intuitivo para cliente (sem treinamento)
- ✅ Feedback visual claro (status, confirmações)
- ✅ Funciona em mobile (responsivo)
- ✅ QR Code fácil de escanear

---

## 🚨 RISCOS E MITIGAÇÕES

### **Risco 1: Cliente não paga e some**
**Mitigação:**
- Conta não fecha automaticamente se faltar saldo
- Alerta visual forte para garçom
- Garçom pode finalizar manualmente

### **Risco 2: Múltiplos pagamentos da mesma pessoa**
**Mitigação:**
- Validar que pessoa não pagou antes de aceitar
- Mostrar status claro (já pago / pendente)
- Desabilitar botão após pagamento

### **Risco 3: QR Code compartilhado indevidamente**
**Mitigação:**
- Token único e expiração (1 hora)
- Validar que split está ativo
- Limitar número de tentativas de pagamento

---

## 📊 COMPARAÇÃO: MVP vs FASE 2

| Feature | MVP | Fase 2 |
|---------|-----|--------|
| Split iniciado por | Garçom | Cliente ou Garçom |
| Split por | Partes iguais | Partes iguais + Itens |
| QR Code | Sim | Sim (melhorado) |
| Gorjeta | Não | Sim (individual) |
| Escolha de valor | Não | Sim (pagar mais/menos) |
| Fidelidade | Não | Sim (individual) |

---

## 🎯 PRÓXIMOS PASSOS

Se quiser implementar:

1. **Decidir se entra no MVP atual:**
   - [ ] Sim, adicionar ao MVP Demo
   - [ ] Não, deixar para Fase 2

2. **Se sim, seguir plano de implementação:**
   - Fase 1: Backend
   - Fase 2: Frontend TPV
   - Fase 3: Frontend Cliente
   - Fase 4: Testes

3. **Se não, documentar para Fase 2:**
   - Adicionar ao backlog
   - Priorizar após feedback do MVP atual

---

**Status:** 📋 Documentação Completa  
**Próxima decisão:** Incluir no MVP atual ou deixar para Fase 2?  
**Última atualização:** 2026-01-20
