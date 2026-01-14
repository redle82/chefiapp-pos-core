# 🥾 BOOT SEQUENCE — Arquitetura de Bootstrap em Camadas

**Data:** 2026-01-24  
**Status:** ✅ **CANONICAL - Princípio Organizador do Sistema**  
**Nível:** 🏛️ Arquitetura Fundamental

---

## 🎯 OBJETIVO

Este documento define a **ordem canônica de inicialização** do sistema. Ele responde à pergunta fundamental:

> **"O que faz tudo ser lido na ordem certa, validado, compilado e não virar caos?"**

**Resposta:** Uma arquitetura de **BOOTSTRAP EM CAMADAS COM GATES IMUTÁVEIS**.

---

## 🧠 ESSÊNCIA

ChefIApp não é "um app React".  
Ele funciona como um **sistema operacional** com:
- 🧱 **Kernel** (Truth Layer)
- 🔐 **Gates** (Verificadores Sequenciais)
- 📜 **Contracts** (Leis Imutáveis)
- 🎯 **Domain** (Onde as coisas acontecem)
- 🛰️ **Satélites** (Interfaces)

**Nada roda "porque alguém importou um hook".**  
**Tudo roda porque passou por um gate.**

---

## 🏗️ ARQUITETURA COMPLETA

### Nome Técnico

**Layered Gate Architecture (Boot → Kernel → Gates → Domain)**

Ou, mais precisamente:

**Deterministic Bootstrap Architecture with Sovereign Gates**

---

## 📊 DIAGRAMA DE BOOTSTRAP

```
┌─────────────────────────────────────────────────────────────┐
│                    POWER ON (Bootstrap)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  🔐 AUTHGATE                                                │
│  "Existe sessão? Token válido?"                             │
│                                                              │
│  ❌ Não → /login                                            │
│  ✅ Sim → Próximo gate                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  👤 IDENTITYGATE                                            │
│  "Quem é você? Usuário existe? Está ativo?"                │
│                                                              │
│  ❌ Não → /onboarding/identity                              │
│  ✅ Sim → Próximo gate                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  🏢 TENANTGATE                                              │
│  "Em nome de quem você está operando?"                      │
│                                                              │
│  • Resolve UMA VEZ                                          │
│  • Sela como ACTIVE                                         │
│  • Não re-resolve se ACTIVE                                 │
│                                                              │
│  ❌ No tenants → /onboarding/identity                     │
│  ⚠️  Multiple → /app/select-tenant                         │
│  ✅ Single/ACTIVE → Próximo gate                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  🧠 DOMAINGATE                                              │
│  "Agora sim: Pedido, Pagamento, Tarefa, Cozinha, Staff"    │
│                                                              │
│  Só entra aqui quem passou por TODOS os gates anteriores   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  🎯 DOMAIN                                                  │
│  Orders | Payments | Tasks | Inventory | Fiscal Observer    │
│                                                              │
│  Característica: Não pergunta sobre tenant/sessão/identity  │
│  Assume que isso já foi resolvido                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  🛰️  SATÉLITES (Interfaces)                                 │
│  TPV | KDS | App Staff | Web Ordering | Owner Dashboard     │
│                                                              │
│  Regra: Não decidem nada                                    │
│  Apenas observam e disparam intenções                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🥾 CAMADA 1: BOOTSTRAP (Power On)

### Responsabilidade
Responder: **"Existe sessão? Existe usuário?"**

### O Que Roda Aqui
- ✅ Auth provider
- ✅ Session check
- ✅ Token validation

### Documentos que Governam
- `CORE_WEB_CONTRACT.md`
- `SYSTEM_TRUTH_CODEX.md` (Lei 1: UI é consequência)

### Regra Imutável
> **Sem sessão válida, nada sobe.**

---

## 🧱 CAMADA 2: KERNEL (Truth Layer)

### Responsabilidade
Definir a **verdade única** do sistema.

### Características
- ❌ Não existe UI
- ❌ Não existe rota
- ❌ Não existe componente
- ✅ Só existe verdade

### O Que É Kernel?
- Definição de verdade
- Regras que não mudam
- Contratos imutáveis

### Documentos CANÔNICOS
- `SYSTEM_TRUTH_CODEX.md` ← **lei suprema**
- `SYSTEM_OF_RECORD_SPEC.md`
- `PARTE_3_REGRAS_DO_CORE.md`

### Regra Imutável
> **O Kernel não depende de UI, React, rota ou hook.**  
> **Ele existe mesmo que o frontend queime.**

---

## 🔐 CAMADA 3: GATES (Onde Tudo É Decidido)

### Responsabilidade
**Verificadores sequenciais.** Se falhar, o sistema **NÃO CONTINUA**.

### Ordem Real dos Gates

```
AuthGate
  ↓
IdentityGate
  ↓
TenantGate
  ↓
( Futuro: RestaurantGate )
  ↓
DomainGate
```

---

### 🔐 AuthGate

**Pergunta:** "Existe sessão? Token válido?"

**Ações:**
- ❌ Não → `/login`
- ✅ Sim → Próximo gate

**Documento:** `CORE_WEB_CONTRACT.md`

---

### 👤 IdentityGate

**Pergunta:** "Quem é você? Usuário existe? Está ativo?"

**Ações:**
- ❌ Não → `/onboarding/identity`
- ✅ Sim → Próximo gate

**Documento:** `CONTRACT_HIERARCHY.md`

**Regra:** Identity precede tudo (ONT-001)

---

### 🏢 TenantGate

**Pergunta:** "Em nome de quem você está operando?"

**Características:**
- Resolve **UMA VEZ**
- Sela como `ACTIVE`
- **Não re-resolve se ACTIVE**

**Ações:**
- ❌ No tenants → `/onboarding/identity`
- ⚠️  Multiple → `/app/select-tenant`
- ✅ Single/ACTIVE → Próximo gate

**Documento CANÔNICO:** `TENANT_RESOLUTION_CONTRACT.md`

**Regra Imutável:**
> **Tenant ACTIVE nunca é re-resolvido.**

---

### 🧠 DomainGate

**Pergunta:** "Agora sim: Pedido, Pagamento, Tarefa, Cozinha, Staff"

**Característica:**
- Só entra aqui quem passou por **TODOS os gates anteriores**

**Documentos:**
- `ARCHITECTURE_FLOW_LOCKED.md`
- `ORDER_CONTRACT.md`
- `TASKOPS_CONTRACT.md`

---

## 🎯 CAMADA 4: DOMAIN (Onde as Coisas ACONTECEM)

### Responsabilidade
Executar operações de negócio.

### O Que Vive Aqui
- Orders
- Payments
- Tasks
- Inventory
- Fiscal Observer

### Característica Crítica
> **O Domain não pergunta nada sobre tenant, sessão ou identidade.**  
> **Ele assume que isso já foi resolvido.**

### Por Que Loops São Perigosos
Eles violam a separação **Gate → Domain**.

Se o Domain precisa perguntar sobre tenant, o Gate falhou.

---

## 🛰️ CAMADA 5: SATÉLITES (Interfaces)

### Responsabilidade
Observar e disparar intenções.

### O Que São Satélites
- TPV
- KDS
- App Staff
- Web Ordering
- Owner Dashboard

### Regra Imutável
> **Satélites não decidem nada.**  
> **Eles apenas observam e disparam intenções.**

### Documentos
- `SATELLITE_MODEL.md` (se existir)
- `APP_STAFF_CONTRACT.md` (se existir)

---

## 📚 ORDEM CANÔNICA DE LEITURA/INVOCAÇÃO

### Hierarquia de Documentos

```
1. SYSTEM_TRUTH_CODEX.md
   → Define o que é verdade
   ↓
2. CORE_WEB_CONTRACT.md
   → Define como o sistema sobe
   ↓
3. CONTRACT_HIERARCHY.md
   → Define quem manda em quem
   ↓
4. TENANT_RESOLUTION_CONTRACT.md
   → Fecha o contexto operacional
   ↓
5. ARCHITECTURE_FLOW_LOCKED.md
   → Define os gates técnicos
   ↓
6. PARTE_3_REGRAS_DO_CORE.md
   → Define o comportamento do domínio
   ↓
7. ORDER_CONTRACT.md / TASKOPS_CONTRACT.md
   → Define contratos específicos
   ↓
8. TESTE_E2E / HUMAN TEST PROTOCOL
   → Valida que tudo isso está vivo
```

### Regra Crítica
> **Se um documento acima estiver errado, tudo abaixo quebra.**

---

## ⚖️ LEIS IMUTÁVEIS QUE REGEM TUDO

Estas **NÃO SÃO OPINIONAIS**:

### 1. Truth Zero
> **Verdade não nasce na UI**

### 2. Gate Before Domain
> **Nenhuma ação sem gate**

### 3. Single Sovereign Context
> **Um tenant por vez, selado**

### 4. No Hidden Transitions
> **Estados explícitos**

### 5. Imutabilidade Pós-Fechamento
> **O passado não muda**

### Onde Vivem Essas Leis
- `SYSTEM_TRUTH_CODEX.md`
- `PARTE_3_REGRAS_DO_CORE.md`

---

## 🛠️ ONDE ESTÁ O BACKEND E O WORKFLOW?

### Backend NÃO é "um lugar", é uma camada

```
┌─────────────────────────────────────────┐
│  Banco → Sistema de Registro            │
│  Triggers → Guardião das Leis           │
│  APIs → Executores                      │
│  Realtime → Propagação                  │
└─────────────────────────────────────────┘
```

### Documento-Chave
- `SYSTEM_OF_RECORD_SPEC.md`

---

### Workflow Real

```
UI
  ↓ intenção
Domain
  ↓ comando
Backend
  ↓ valida
DB (triggers)
  ↓ confirma
Observers (KDS, Tasks, Fiscal)
```

---

## 🧩 POR QUE ISSO FUNCIONA?

### Princípios Fundamentais

1. **Nada acontece "porque alguém clicou"**
   - Tudo acontece porque passou por um contrato

2. **O sistema não confia em UI**
   - UI é consequência, não causa

3. **O sistema não confia em dev**
   - Leis são imutáveis, não opiniões

4. **O sistema confia em leis**
   - Gates, contratos, triggers

---

## 🎯 FRASE FINAL (ESSÊNCIA)

> **ChefIApp não é montado por componentes.**  
> **Ele é montado por VERDADE → GATES → CONTRATOS → EXECUÇÃO.**

---

## 📋 CHECKLIST DE VALIDAÇÃO

### Bootstrap
- [ ] AuthGate funciona (sem sessão → login)
- [ ] IdentityGate funciona (sem identity → onboarding)
- [ ] TenantGate funciona (resolve e sela)
- [ ] DomainGate funciona (só após todos os gates)

### Kernel
- [ ] Truth definida (SYSTEM_TRUTH_CODEX.md)
- [ ] Contratos imutáveis (CONTRACT_HIERARCHY.md)
- [ ] Regras do Core (PARTE_3_REGRAS_DO_CORE.md)

### Domain
- [ ] Domain não pergunta sobre tenant/sessão
- [ ] Domain assume contexto resolvido
- [ ] Domain executa operações de negócio

### Satélites
- [ ] Satélites não decidem
- [ ] Satélites apenas observam e disparam
- [ ] Satélites respeitam contratos

---

## 🔗 DOCUMENTOS RELACIONADOS

### Fundamentais
- `SYSTEM_TRUTH_CODEX.md` - Lei suprema
- `CORE_WEB_CONTRACT.md` - Contratos web
- `CONTRACT_HIERARCHY.md` - Hierarquia de contratos

### Gates
- `TENANT_RESOLUTION_CONTRACT.md` - Tenant Gate
- `ARCHITECTURE_FLOW_LOCKED.md` - FlowGate técnico

### Domain
- `PARTE_3_REGRAS_DO_CORE.md` - Regras do Core
- `SYSTEM_OF_RECORD_SPEC.md` - Sistema de registro

---

## 🧪 VALIDAÇÃO

### Teste de Bootstrap

```typescript
// 1. Sem sessão → deve ir para /login
// 2. Com sessão, sem identity → deve ir para /onboarding/identity
// 3. Com sessão + identity, sem tenant → deve resolver tenant
// 4. Com tudo resolvido → deve permitir acesso ao domain
```

### Teste de Gates

```typescript
// Cada gate deve:
// - Bloquear se condição não satisfeita
// - Permitir se condição satisfeita
// - Não re-executar se já resolvido
```

---

## ✅ CONCLUSÃO

**Esta é a arquitetura que governa tudo.**

- ✅ Bootstrap em camadas
- ✅ Gates imutáveis
- ✅ Contratos canônicos
- ✅ Domain isolado
- ✅ Satélites observadores

**Se algo viola esta arquitetura, o sistema quebra.**

---

**Última atualização:** 2026-01-24  
**Status:** ✅ **CANONICAL - Princípio Organizador**
