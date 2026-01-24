# ✅ Issue #5: Contador de ações pendentes (ERRO-008) - COMPLETO

**Status:** ✅ Implementado  
**Data:** 2026-01-30  
**Tempo:** ~1h (já estava parcialmente implementado)

---

## 🎯 O que foi implementado

### 1. Contador discreto visível
- Contador exibido no footer do NowActionCard
- Mostra "1 ação pendente" ou "X ações pendentes"
- Cor muda conforme urgência (normal: cinza, crítico: vermelho, muitas: laranja)

### 2. Atualização em tempo real
- Contador atualiza quando ação muda
- Atualização automática a cada 10s
- Sincronizado com ações reais

### 3. Posicionamento discreto
- Footer do card (não interfere na ação principal)
- Tamanho de fonte pequeno (12px)
- Cor discreta (cinza)

---

## 📁 Arquivos Modificados

1. `mobile-app/components/NowActionCard.tsx`
   - Condição mudada de `pendingCount > 1` para `pendingCount > 0`
   - Texto singular/plural: "1 ação pendente" vs "X ações pendentes"
   - Cor laranja para muitas ações (> 5)

2. `mobile-app/hooks/useNowEngine.ts`
   - Interval de 10s para atualizar contador
   - Cleanup do interval no unmount

---

## ✅ Critério de Pronto (Atendido)

- ✅ Contador discreto visível no AppStaff
- ✅ Contador atualiza em tempo real
- ✅ Posicionamento: footer do card
- ✅ Cor muda conforme urgência
- ✅ Contador sempre sincronizado com ações reais

---

## 🧪 Testes Manuais

### Teste 1: Contador com 1 ação
1. Abrir AppStaff
2. Ter 1 ação pendente
3. **Esperado:** Contador mostra "1 ação pendente" (se houver)

### Teste 2: Contador com múltiplas ações
1. Criar 3 pedidos novos
2. **Esperado:** Contador mostra "3 ações pendentes"
3. Completar 1 ação
4. **Esperado:** Contador atualiza para "2 ações pendentes"

### Teste 3: Contador desaparece
1. Completar todas as ações
2. **Esperado:** Contador desaparece ou mostra "0 ações pendentes"

---

## 📊 KPI Sofia (Para validar)

- **Meta:** Contador sempre sincronizado (0 casos de desincronização / semana)
- **Meta:** Garçons relatam menos ansiedade sobre "o que fazer"

---

## 🔄 Rollback

Se necessário reverter:
1. Ocultar contador (condição `pendingCount > 1`)
2. Remover interval de atualização
3. Manter apenas atualização quando ação muda

---

**Próxima Issue:** #6 - Banner persistente de modo offline
