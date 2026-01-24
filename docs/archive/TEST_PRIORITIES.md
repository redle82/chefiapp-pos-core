# 🎯 TESTES PRIORITÁRIOS — Resumo Executivo

**Data:** 2026-01-11

---

## 🔴 P0 - CRÍTICO (Esta Semana)

### 1. FlowGate
**Por quê:** Navegação soberana - se quebrar, todo o sistema quebra  
**Testes:** 15-20  
**Tempo:** 1-2 dias

### 2. create_tenant_atomic RPC
**Por quê:** Criação de tenant - erro atual (heartbeat NULL)  
**Testes:** 10-15  
**Tempo:** 1 dia

### 3. OnboardingWizard
**Por quê:** Fluxo crítico do usuário - 8 etapas complexas  
**Testes:** 20-25  
**Tempo:** 2-3 dias

### 4. AuthPage
**Por quê:** Ponto de entrada - autenticação é fundamental  
**Testes:** 10-15  
**Tempo:** 1 dia

**Total P0:** 55-75 testes | 5-7 dias

---

## 🟡 P1 - ALTO (2 Semanas)

### 5. TPV
**Testes:** 25-30

### 6. OrderContext
**Testes:** 15-20

### 7. DashboardZero
**Testes:** 10-15

**Total P1:** 50-65 testes | 1-2 semanas

---

## 📊 RESUMO

| Prioridade | Testes | Tempo |
|------------|--------|-------|
| **P0 - Crítico** | 55-75 | 1 semana |
| **P1 - Alto** | 50-65 | 2 semanas |
| **P2 - Médio** | 80-110 | 1 mês |
| **TOTAL** | **185-250** | **2 meses** |

---

**Começar por:** FlowGate + create_tenant_atomic
