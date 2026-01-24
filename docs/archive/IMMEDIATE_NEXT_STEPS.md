# 🚀 PRÓXIMOS PASSOS IMEDIATOS

**Data:** 16 Janeiro 2026
**Status:** Planejamento completo, pronto para execução

---

## 🔴 AÇÃO CRÍTICA #1: Aplicar Migrations RLS (30 minutos)

### Por que é crítico:
- ⚠️ Sistema está vulnerável sem RLS
- ⚠️ Race conditions podem causar pedidos duplicados
- ⚠️ Dados podem vazar entre restaurantes

### O que fazer:
1. **Abrir terminal**
2. **Executar 3 comandos:**
   ```bash
   supabase login
   supabase link --project-ref qonfbtwsxeggxbkhqnxl
   supabase db push
   ```
3. **Validar:**
   - Abrir: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new
   - Colar: `VALIDAR_DEPLOY.sql`
   - Executar e verificar todos os ✅

### Documentação:
- `APLICAR_MCP_AGORA.md` - Instruções completas
- `INSTRUCOES_DETALHADAS_PASSO_A_PASSO.md` - Guia super detalhado

**Tempo:** 30 minutos
**Bloqueador:** Nenhum (pode fazer agora)

---

## 🟡 AÇÃO IMPORTANTE #2: Validar Offline Mode (2-3 dias)

### Por que é importante:
- ✅ Offline Mode está 90% completo
- ✅ Precisa validação antes de marcar como completo
- ✅ Identificar bugs ou melhorias necessárias

### O que fazer:
1. **Abrir TPV no navegador**
2. **DevTools → Network → Offline**
3. **Executar testes:**
   - Criar pedidos offline
   - Verificar sincronização
   - Testar retry e backoff
4. **Documentar resultados**

### Documentação:
- `VALIDAR_OFFLINE_MODE.md` - 7 testes detalhados
- `OFFLINE_MODE_LIMITACOES.md` - Limitações conhecidas

**Tempo:** 2-3 dias
**Bloqueador:** Nenhum (pode fazer agora)

---

## 🟢 AÇÃO ESTRATÉGICA #3: Implementar Glovo (1-2 semanas)

### Por que é estratégico:
- ✅ Prioridade da FASE 1
- ✅ Diferencial competitivo
- ✅ Receita adicional para restaurantes

### O que fazer:
1. **FASE 1 (Dia 1-2):** Setup e estrutura
   - Criar arquivos base
   - Definir tipos TypeScript
   - Implementar OAuth

2. **FASE 2 (Dia 3-5):** Adapter principal
   - Implementar GlovoAdapter
   - Transformar pedidos
   - Integrar com sistema

3. **FASE 3 (Dia 6-7):** Integração completa
   - Webhook receiver
   - Polling (alternativa)
   - Testes end-to-end

### Documentação:
- `GLOVO_IMPLEMENTACAO_PLANO.md` - Plano completo
- `PHASE1_MARKETPLACE_INTEGRATION.md` - API docs

**Tempo:** 1-2 semanas
**Bloqueador:** Credenciais API Glovo (precisa obter)

---

## 📊 DECISÃO: O QUE FAZER AGORA?

### Opção A: Aplicar Migrations RLS (RECOMENDADO)
**Por quê:** Crítico para segurança, rápido (30 min)
**Como:** Ver `APLICAR_MCP_AGORA.md`

---

## 🎯 RECOMENDAÇÃO FINAL

**Ordem sugerida:**
1. **HOJE:** Aplicar migrations RLS (30 min) ⚠️ CRÍTICO
2. **ESTA SEMANA:** Validar Offline Mode (2-3 dias)
3. **PRÓXIMAS 2 SEMANAS:** Implementar Glovo (1-2 semanas)
