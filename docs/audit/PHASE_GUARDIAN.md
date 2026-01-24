# 🛡️ Guardião de Fases — ChefIApp

**Objetivo:** Garantir que uma fase só inicia se a anterior estiver 100% completa

---

## 📋 Regras de Guardião

### FASE 0 — Decisão Estratégica ✅

**Status:** Obrigatória, deve estar 100% completa

**Checklist:**
- [x] Posicionamento "TPV QUE PENSA" documentado
- [x] Escopo congelado
- [x] Pitch comercial atualizado

**Bloqueador para:** Todas as outras fases

---

### FASE 1 — Fechamento Comercial 🟢

**Status:** 90% completo (código pronto, falta deploy)

**Checklist Obrigatório:**
- [x] Código implementado (100%)
- [ ] Migration executada
- [ ] Edge Functions deployadas
- [ ] Variáveis configuradas
- [ ] Testes manuais (5/5 passando)

**Bloqueador para:** Vendas self-service

**Próxima fase:** FASE 2 (já completa, mas FASE 1 deve estar 100% para produção)

---

### FASE 2 — Onboarding + Primeira Venda ✅

**Status:** 100% completo

**Checklist:**
- [x] MenuDemo criado
- [x] FirstSaleGuide criado
- [x] Modo demo implementado
- [x] OnboardingReminder criado

**Bloqueador para:** Nenhuma (já completa)

---

### FASE 3 — Now Engine como Núcleo ✅

**Status:** 100% completo

**Checklist:**
- [x] Now Engine como núcleo absoluto
- [x] Prioridade visual clara
- [x] "Por quê" sempre visível
- [x] Uma ação principal por vez

**Bloqueador para:** Nenhuma (já completa)

---

### FASE 4 — Gamificação Interna ✅

**Status:** 100% completo

**Checklist:**
- [x] Sistema de pontos
- [x] Leaderboard
- [x] Achievements (5-10)
- [x] Integração com Now Engine

**Bloqueador para:** Nenhuma (já completa)

---

### FASE 5 — Polimento dos Apps 🟢

**Status:** 90% completo

**Checklist:**
- [x] RoleSelector criado
- [x] Lazy loading implementado
- [x] React.memo() aplicado
- [x] Haptic feedback completo
- [ ] Testes de performance

**Bloqueador para:** Nenhuma (não é crítico)

**Próxima fase:** Pode continuar sem estar 100%

---

### FASE 6 — Impressão 🟢

**Status:** 80% completo

**Checklist:**
- [x] PrinterSettings criado
- [x] Browser print melhorado
- [x] Documentação completa
- [ ] Testes manuais

**Bloqueador para:** Nenhuma (não é crítico)

**Próxima fase:** Pode continuar sem estar 100%

---

### FASE 7 — Mapa Visual 🔴

**Status:** Adiada

**Pré-requisitos:**
- [ ] FASE 1 completa (100%)
- [ ] FASE 5 completa (100%)
- [ ] FASE 6 completa (100%)
- [ ] Decisão estratégica sobre layout

**Bloqueador para:** Nenhuma (não é crítico)

---

### FASE 8 — Analytics 🔴

**Status:** Não prioritária

**Pré-requisitos:**
- [ ] FASE 1 completa (100%)
- [ ] FASE 2 completa (100%)
- [ ] Decisão estratégica (não é core do "TPV que pensa")

**Bloqueador para:** Nenhuma (não é crítico)

---

## 🎯 Regras de Bloqueio

### Bloqueio Crítico

**FASE 1 deve estar 100% antes de:**
- ✅ Lançamento comercial
- ✅ Vendas self-service
- ✅ Produção com billing

**FASE 0 deve estar 100% antes de:**
- ✅ Qualquer outra fase

### Bloqueio Não-Crítico

**FASE 5 e FASE 6 podem estar <100% para:**
- ✅ Desenvolvimento contínuo
- ✅ Testes internos
- ✅ Pilotos

---

## 📋 Script de Verificação

Execute antes de iniciar uma nova fase:

```bash
./scripts/check-phase-guardian.sh <FASE_NUMERO>
```

**Exemplo:**
```bash
./scripts/check-phase-guardian.sh 7
```

Isso verifica se FASE 1, 5 e 6 estão completas antes de permitir FASE 7.

---

## ✅ Critérios de "100% Completo"

Uma fase está 100% completa quando:

1. ✅ Todo código implementado
2. ✅ Todas as migrations executadas
3. ✅ Todas as Edge Functions deployadas (se aplicável)
4. ✅ Variáveis de ambiente configuradas
5. ✅ Testes manuais passando (se aplicável)
6. ✅ Documentação atualizada

---

**Última atualização:** 2026-01-30
