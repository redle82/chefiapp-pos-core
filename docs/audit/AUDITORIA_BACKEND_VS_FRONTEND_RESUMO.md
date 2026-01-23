# AUDITORIA BACKEND vs FRONTEND — RESUMO EXECUTIVO

**Data:** 2026-01-18  
**Nota:** 6.5/10  
**Status:** Parcialmente Invertida (com pontos críticos)

---

## 🎯 VEREDITO RÁPIDO

**Quem manda: Frontend ou Backend?**

**Resposta:** Depende da operação.

- ✅ **Pedidos:** Backend manda (calcula total, valida membership)
- ✅ **Billing:** Backend manda (único escritor)
- ⚠️ **Turnos:** Frontend manda parcialmente (insere direto, RLS só valida membership)

---

## ✅ TOP 5 A CERTOS

1. **Backend calcula total de pedidos** (frontend não pode mentir sobre preço)
2. **Backend valida membership em RPCs** (frontend não pode acessar outro tenant)
3. **Billing é autoritário no backend** (frontend só inicia, backend executa)
4. **RLS protege dados** (usuários só veem seu restaurante)
5. **Edge Functions são backend real** (não são pass-through)

---

## ❌ TOP 5 ERROS PERIGOSOS

1. **Frontend valida permissões sem backend validar role**
   - Risco: Qualquer membro pode executar ações se burlar frontend
   - Severidade: 🟡 Média

2. **Turnos: Insert direto sem validação de regras de negócio**
   - Risco: Pode criar turnos duplicados ou inválidos
   - Severidade: 🟡 Média

3. **Frontend mantém estado local de turno que pode divergir**
   - Risco: UI pode mostrar estado incorreto
   - Severidade: 🟢 Baixa (só UX)

4. **Validação de ações pendentes só no frontend**
   - Risco: Pode fechar turno com ações pendentes se burlar frontend
   - Severidade: 🟡 Média

5. **Token validado só por formato no frontend**
   - Risco: Token expirado pode ser aceito temporariamente
   - Severidade: 🟢 Baixa

---

## 🚨 RISCOS EM PRODUÇÃO

### Fraude
- 🟢 **Baixo:** Backend calcula total (não pode mentir sobre preço)
- 🟡 **Médio:** Qualquer membro pode executar ações críticas se burlar frontend

### Bug Silencioso
- 🟡 **Médio:** Frontend pode ter estado local desincronizado
- 🟢 **Baixo:** Pedidos e billing são autoritários no backend

### Dados Inconsistentes
- 🟡 **Médio:** Turnos podem ser criados sem validação de regras
- 🟢 **Baixo:** Pedidos e billing são validados no backend

---

## 📋 RECOMENDAÇÕES (DIREÇÕES)

1. **Backend deve validar role em ações críticas**
   - RPCs devem validar role, não só membership

2. **Turnos devem usar RPC sempre**
   - Não inserir direto em `gm_shifts`, usar `start_turn()`

3. **Validação de ações pendentes deve estar no backend**
   - RPC `end_shift()` deve validar antes de permitir fechamento

4. **Frontend não deve manter estado "verdadeiro"**
   - Estado deve ser derivado de query ao banco

5. **Permissões devem ser validadas no backend**
   - Backend deve ter tabela de permissões e validar em RPCs

---

## 📊 CLASSIFICAÇÃO POR FLUXO

| Fluxo | Classificação | Backend Autoritário? |
|-------|---------------|---------------------|
| Login | 🟢 Saudável | ✅ Sim (Supabase Auth) |
| Início de Turno | 🟡 Frágil | ⚠️ Parcial (RLS protege, mas falta validação) |
| Criação de Pedido | 🟢 Saudável | ✅ Sim (calcula total, valida membership) |
| Billing | 🟢 Saudável | ✅ Sim (único escritor) |
| Cancelar Pedido | 🟡 Frágil | ⚠️ Parcial (valida membership, mas não role) |
| Fechar Turno | 🟡 Frágil | ⚠️ Parcial (RLS protege ownership, mas não valida role) |

---

## 🎯 CONCLUSÃO

**O ChefIApp tem uma arquitetura parcialmente invertida, mas com pontos críticos bem protegidos.**

**Risco Geral:** 🟡 **Médio**

Backend protege dados críticos (pedidos, billing), mas operações operacionais (turnos) são frágeis.

**Próximo Passo:** Implementar validação de role no backend para ações críticas.

---

**DOCUMENTO COMPLETO:** `docs/audit/AUDITORIA_BACKEND_VS_FRONTEND.md`
