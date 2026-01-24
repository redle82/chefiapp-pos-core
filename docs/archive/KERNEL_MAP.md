# 🧠 KERNEL MAP — Mapa da Arquitetura do Sistema

**Data:** 2026-01-24  
**Status:** ✅ **CANONICAL - Diagrama de Referência**  
**Tipo:** Diagrama Arquitetural

---

## 🎯 OBJETIVO

Este documento é um **mapa visual** da arquitetura completa do sistema, mostrando como cada camada se relaciona e qual é a ordem de execução.

---

## 📊 MAPA COMPLETO

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CHEFIAPP POS CORE                                │
│                    Deterministic Bootstrap Architecture                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ POWER ON
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  🥾 BOOTSTRAP LAYER                                                      │
│  "Existe sessão? Existe usuário?"                                       │
│                                                                          │
│  Componentes:                                                           │
│  • Auth Provider                                                        │
│  • Session Check                                                        │
│  • Token Validation                                                     │
│                                                                          │
│  Documentos:                                                            │
│  • CORE_WEB_CONTRACT.md                                                 │
│  • SYSTEM_TRUTH_CODEX.md (Lei 1)                                        │
│                                                                          │
│  Regra: Sem sessão válida, nada sobe                                    │
└───────────────────────┬─────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  🧱 KERNEL LAYER (Truth Layer)                                          │
│  "O que é verdade? O que não muda?"                                      │
│                                                                          │
│  Características:                                                       │
│  • Não existe UI                                                        │
│  • Não existe rota                                                       │
│  • Não existe componente                                                │
│  • Só existe verdade                                                    │
│                                                                          │
│  Documentos CANÔNICOS:                                                  │
│  • SYSTEM_TRUTH_CODEX.md ← Lei Suprema                                 │
│  • SYSTEM_OF_RECORD_SPEC.md                                            │
│  • PARTE_3_REGRAS_DO_CORE.md                                           │
│                                                                          │
│  Regra: Kernel não depende de UI/React/rota/hook                        │
└───────────────────────┬─────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  🔐 GATES LAYER (Verificadores Sequenciais)                             │
│  "Onde tudo é decidido"                                                  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🔐 AUTHGATE                                                      │  │
│  │  "Existe sessão? Token válido?"                                   │  │
│  │  ❌ Não → /login                                                  │  │
│  │  ✅ Sim → Próximo gate                                            │  │
│  └───────────────────────┬──────────────────────────────────────────┘  │
│                          ↓                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  👤 IDENTITYGATE                                                  │  │
│  │  "Quem é você? Usuário existe? Está ativo?"                      │  │
│  │  ❌ Não → /onboarding/identity                                    │  │
│  │  ✅ Sim → Próximo gate                                            │  │
│  │                                                                    │  │
│  │  Regra: Identity precede tudo (ONT-001)                           │  │
│  └───────────────────────┬──────────────────────────────────────────┘  │
│                          ↓                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🏢 TENANTGATE                                                    │  │
│  │  "Em nome de quem você está operando?"                            │  │
│  │                                                                    │  │
│  │  Características:                                                 │  │
│  │  • Resolve UMA VEZ                                                │  │
│  │  • Sela como ACTIVE                                               │  │
│  │  • Não re-resolve se ACTIVE                                       │  │
│  │                                                                    │  │
│  │  Ações:                                                           │  │
│  │  ❌ No tenants → /onboarding/identity                            │  │
│  │  ⚠️  Multiple → /app/select-tenant                                │  │
│  │  ✅ Single/ACTIVE → Próximo gate                                  │  │
│  │                                                                    │  │
│  │  Documento: TENANT_RESOLUTION_CONTRACT.md                        │  │
│  │                                                                    │  │
│  │  Regra: Tenant ACTIVE nunca é re-resolvido                        │  │
│  └───────────────────────┬──────────────────────────────────────────┘  │
│                          ↓                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🧠 DOMAINGATE                                                    │  │
│  │  "Agora sim: Pedido, Pagamento, Tarefa, Cozinha, Staff"          │  │
│  │                                                                    │  │
│  │  Regra: Só entra aqui quem passou por TODOS os gates anteriores   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  🎯 DOMAIN LAYER                                                        │
│  "Onde as coisas ACONTECEM"                                              │
│                                                                          │
│  Componentes:                                                           │
│  • Orders                                                               │
│  • Payments                                                             │
│  • Tasks                                                                │
│  • Inventory                                                            │
│  • Fiscal Observer                                                      │
│                                                                          │
│  Característica Crítica:                                                │
│  • Não pergunta sobre tenant/sessão/identity                            │
│  • Assume que isso já foi resolvido                                    │
│                                                                          │
│  Por Que Loops São Perigosos:                                           │
│  • Violam separação Gate → Domain                                       │
│  • Se Domain precisa perguntar sobre tenant, Gate falhou                │
└───────────────────────┬─────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  🛰️  SATÉLITES LAYER (Interfaces)                                       │
│  "Observadores e Disparadores de Intenções"                             │
│                                                                          │
│  Componentes:                                                           │
│  • TPV                                                                  │
│  • KDS                                                                  │
│  • App Staff                                                            │
│  • Web Ordering                                                         │
│  • Owner Dashboard                                                      │
│                                                                          │
│  Regra Imutável:                                                        │
│  • Satélites não decidem nada                                           │
│  • Apenas observam e disparam intenções                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUXO DE DADOS

### Workflow Real

```
┌─────────┐
│   UI    │
└────┬────┘
     │ intenção
     ↓
┌─────────┐
│ Domain  │
└────┬────┘
     │ comando
     ↓
┌─────────┐
│ Backend │
└────┬────┘
     │ valida
     ↓
┌─────────┐
│   DB    │
│(triggers)│
└────┬────┘
     │ confirma
     ↓
┌─────────┐
│Observers│
│(KDS,    │
│ Tasks,  │
│ Fiscal) │
└─────────┘
```

---

## 📚 HIERARQUIA DE DOCUMENTOS

```
┌─────────────────────────────────────────┐
│ 1. SYSTEM_TRUTH_CODEX.md               │
│    → Define o que é verdade             │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 2. CORE_WEB_CONTRACT.md                │
│    → Define como o sistema sobe          │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 3. CONTRACT_HIERARCHY.md                │
│    → Define quem manda em quem           │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 4. TENANT_RESOLUTION_CONTRACT.md       │
│    → Fecha o contexto operacional        │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 5. ARCHITECTURE_FLOW_LOCKED.md          │
│    → Define os gates técnicos           │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 6. PARTE_3_REGRAS_DO_CORE.md           │
│    → Define comportamento do domínio    │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 7. ORDER_CONTRACT.md / TASKOPS...      │
│    → Define contratos específicos       │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 8. TESTE_E2E / HUMAN TEST PROTOCOL     │
│    → Valida que tudo está vivo          │
└─────────────────────────────────────────┘
```

**Regra Crítica:** Se um documento acima estiver errado, tudo abaixo quebra.

---

## ⚖️ LEIS IMUTÁVEIS

```
┌─────────────────────────────────────────┐
│ 1. Truth Zero                          │
│    → Verdade não nasce na UI            │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 2. Gate Before Domain                  │
│    → Nenhuma ação sem gate              │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 3. Single Sovereign Context            │
│    → Um tenant por vez, selado           │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 4. No Hidden Transitions                │
│    → Estados explícitos                 │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 5. Imutabilidade Pós-Fechamento        │
│    → O passado não muda                 │
└─────────────────────────────────────────┘
```

**Onde Vivem:** `SYSTEM_TRUTH_CODEX.md`, `PARTE_3_REGRAS_DO_CORE.md`

---

## 🧩 POR QUE FUNCIONA?

```
┌─────────────────────────────────────────┐
│ Nada acontece "porque alguém clicou"    │
│ Tudo acontece porque passou por         │
│ um contrato                             │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ Sistema não confia em UI                │
│ UI é consequência, não causa            │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ Sistema não confia em dev               │
│ Leis são imutáveis, não opiniões        │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ Sistema confia em leis                  │
│ Gates, contratos, triggers              │
└─────────────────────────────────────────┘
```

---

## 🎯 FRASE FINAL

> **ChefIApp não é montado por componentes.**  
> **Ele é montado por VERDADE → GATES → CONTRATOS → EXECUÇÃO.**

---

**Última atualização:** 2026-01-24  
**Status:** ✅ **CANONICAL - Diagrama de Referência**
