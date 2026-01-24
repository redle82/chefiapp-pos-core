# 🛡️ Hardening P2 - Plano de Execução

**Data:** 18 Janeiro 2026  
**Status:** 🟡 **PLANEJADO**  
**Após:** Hardening P0 e P1 completos

---

## 📊 Contexto

Após completar **Hardening P0** (5 problemas críticos) e **Hardening P1** (4 problemas de alta prioridade), agora focamos nos **P2s** - problemas de menor prioridade que melhoram qualidade e UX.

---

## 🎯 P2s Identificados

### P2-1: Health Bypass Flag Production Risk 🟡

**Arquivo:** `merchant-portal/src/core/health/useCoreHealth.ts` (linha ~81)

**Problema:**
- Flag de bypass de health pode vazar para produção
- Risco de segurança e operacional

**Solução:**
- Adicionar verificação `import.meta.env.DEV`
- Bloquear bypass em produção

**Esforço:** 30 minutos

---

### P2-2: AppStaff Preview Actions No Warning 🟡

**Arquivo:** `merchant-portal/src/pages/AppStaff/AppStaff.tsx` (linha ~209)

**Problema:**
- Ações de preview não mostram feedback "não salvo"
- UX confusa - ações parecem funcionar mas não salvam

**Solução:**
- Adicionar toast/feedback "Ação de preview - não salva"
- Indicador visual de modo preview

**Esforço:** 1-2 horas

---

### P2-3: Creating Page 800ms Success Delay 🟡

**Arquivo:** `merchant-portal/src/pages/CreatingPage.tsx` (ou similar)

**Problema:**
- Delay de 800ms antes de mostrar sucesso
- Sem verificação se criação realmente sucedeu
- UX pode mostrar sucesso falso

**Solução:**
- Adicionar verificação real de sucesso
- Remover delay artificial
- Mostrar sucesso apenas quando confirmado

**Esforço:** 1-2 horas

---

### P2-4: Queue Garbage Collection 🟡

**Arquivo:** `merchant-portal/src/core/queue/useOfflineQueue.ts` ou `OfflineSync.ts`

**Problema:**
- Items aplicados há mais de 24h não são limpos
- Acúmulo de dados desnecessários no IndexedDB
- Performance degrada com o tempo

**Solução:**
- Implementar garbage collection automática
- Limpar items com status 'applied' há mais de 24h
- Executar periodicamente (ex: a cada hora)

**Esforço:** 2-3 horas

---

### P2-5: Duplicate Border Style 🟢

**Arquivo:** `merchant-portal/src/pages/AppStaff/WorkerTaskFocus.tsx`

**Problema:**
- Warning do esbuild: `Duplicate key "border" in object literal`
- Build limpo mas warning desnecessário

**Solução:**
- Remover duplicação de `border`
- Manter layout/visual idêntico

**Esforço:** 5 minutos

---

## 📋 Plano de Execução

### Dia 1: Correções Rápidas (1-2 horas)

**Manhã:**
- [ ] **P2-5**: Remover duplicate border (5 min)
- [ ] **P2-1**: Adicionar DEV check no health bypass (30 min)

**Tarde:**
- [ ] **P2-3**: Corrigir delay de criação (1-2h)

**Total Dia 1:** 1.5-2.5 horas

---

### Dia 2: UX e Performance (3-5 horas)

**Manhã:**
- [ ] **P2-2**: Adicionar feedback em preview actions (1-2h)

**Tarde:**
- [ ] **P2-4**: Implementar garbage collection (2-3h)

**Total Dia 2:** 3-5 horas

---

## ✅ Critérios de Aceite

### P2-1: Health Bypass
- [ ] Bypass só funciona em DEV
- [ ] Produção bloqueia bypass
- [ ] Testes passam

### P2-2: Preview Feedback
- [ ] Toast mostra "Preview - não salva"
- [ ] Indicador visual de modo preview
- [ ] UX clara sobre ações temporárias

### P2-3: Success Verification
- [ ] Delay removido ou justificado
- [ ] Verificação real de sucesso
- [ ] Não mostra sucesso falso

### P2-4: Garbage Collection
- [ ] Items > 24h são limpos
- [ ] Execução periódica automática
- [ ] Performance melhorada

### P2-5: Duplicate Border
- [ ] Warning removido
- [ ] Layout idêntico
- [ ] Build limpo

---

## 🧪 Testes Necessários

### P2-1
- [ ] Testar em DEV → bypass funciona
- [ ] Testar em PROD → bypass bloqueado

### P2-2
- [ ] Executar ação preview → feedback aparece
- [ ] Verificar indicador visual

### P2-3
- [ ] Criar página → sucesso apenas quando confirmado
- [ ] Verificar sem delay artificial

### P2-4
- [ ] Criar items antigos (> 24h)
- [ ] Verificar limpeza automática
- [ ] Verificar performance

### P2-5
- [ ] Build sem warnings
- [ ] Visual idêntico

---

## 📊 Priorização

| P2 | Impacto | Esforço | Prioridade |
|----|---------|---------|------------|
| **P2-5** | 🟢 Baixo | 5 min | **1️⃣ PRIMEIRO** |
| **P2-1** | 🟡 Médio | 30 min | **2️⃣ SEGUNDO** |
| **P2-3** | 🟡 Médio | 1-2h | **3️⃣ TERCEIRO** |
| **P2-2** | 🟡 Médio | 1-2h | **4️⃣ QUARTO** |
| **P2-4** | 🟡 Médio | 2-3h | **5️⃣ QUINTO** |

**Total:** 4.5-7.5 horas (1-2 dias)

---

## 🚀 Próximos Passos

1. **Validar Hardening P0 e P1 completo** (se ainda não feito)
2. **Começar por P2-5** (correção rápida de 5 min)
3. **Seguir ordem de prioridade** acima
4. **Testar cada correção** antes de avançar
5. **Documentar resultados** em `HARDENING_P2_STATUS.md`

---

## 📚 Referências

- **Fonte:** `docs/audit/TRUTH_AUDIT_SUMMARY.md`
- **Issues:** `docs/ISSUES_ACTIONABLE_P0_P1_P2.md`
- **Contexto:** Hardening P0 e P1 completos

---

**Última atualização:** 18 Janeiro 2026  
**Status:** 🟡 Aguardando início
