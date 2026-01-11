# 🔥 ROADMAP VENCEDOR (NÃO "BONITO")

**Data:** 11 Janeiro 2026  
**Objetivo Real:** Ser claramente melhor para restaurantes independentes caóticos  
**Princípio Operacional:** ChefIApp não compete por feature count. Compete por confiabilidade no caos.

> "A partir de agora, toda feature precisa responder a uma única pergunta: **'Isso evita que o restaurante pare num dia ruim?'** Se a resposta não for SIM, a feature não entra."

---

## 🟢 FASE 1 — "NÃO QUEBRA" (0–6 semanas)
**Objetivo:** Ser o POS que não falha quando tudo falha.

### 1️⃣ Offline Mode (Prioridade Máxima)
*O restaurante nunca para, mesmo sem internet.*

- [x] Criar pedido offline (IndexedDB) ✅ **IMPLEMENTADO**
- [x] Adicionar itens offline ✅ **IMPLEMENTADO**
- [x] Fechar pedido offline ✅ **IMPLEMENTADO**
- [x] Sincronização automática quando voltar online ✅ **IMPLEMENTADO**
- ❌ **Fora de escopo:** Edição complexa, merge inteligente, UI bonita.

**Status Atual:**
- ✅ `OfflineOrderContext` implementado com IndexedDB
- ✅ `useOfflineReconciler` funcional
- ✅ `OrderContextReal` detecta offline e cria pedidos localmente
- ✅ Sincronização automática com retry e backoff exponencial
- ✅ UI mostra status offline/pending/online
- ⚠️ **PRÓXIMO:** Validar cenário completo "desligar roteador"

### 2️⃣ Integração de Delivery Única (A que dói mais)
*Uma benfeita vale mais que três medíocres.*

- [ ] Integração Glovo (Foco inicial) ⚠️ **ESTRUTURA EXISTE, PRECISA IMPLEMENTAR**
- [ ] Recebimento de pedidos direto no POS
- [ ] Impressão automática na cozinha
- ❌ **Fora de escopo:** Uber Eats, Deliveroo (por enquanto).

**Status Atual:**
- ✅ `delivery-integration-service.ts` existe (stub)
- ✅ `OrderIngestionPipeline` implementado
- ✅ Webhook handler para GloriaFood (exemplo)
- ✅ Estrutura de adapters (`IntegrationAdapter`)
- ⚠️ **PRÓXIMO:** Implementar Glovo API real (não stub)

### 3️⃣ Fiscal Mínimo Legal
*Evitar multa ≠ Encantar auditor.*

- [ ] SAF-T válido (Estrutura XML) ⚠️ **MIGRATION EXISTE, PRECISA IMPLEMENTAR**
- [ ] Emissão de fatura básica
- [ ] Impressão de comprovante fiscal
- ❌ **Fora de escopo:** Dashboard fiscal, relatórios avançados.

**Status Atual:**
- ✅ Migration `fiscal_event_store` criada
- ⚠️ **PRÓXIMO:** Implementar geração SAF-T XML
- ⚠️ **PRÓXIMO:** Implementar emissão de fatura

---

## 🟡 FASE 2 — "PENSA COMIGO" (2–4 meses)
**Objetivo:** O sistema reduz a "burrice operacional".

### 4️⃣ AppStaff (Simples e Visível)
- [ ] Alertas automáticos (ex: "Mesa 4 sem pedido há 20min")
- [ ] Sugestões contextuais
- [ ] Menos cliques para ações comuns

**Status Atual:**
- ✅ `AppStaff` module existe
- ✅ `ReflexEngine` implementado
- ⚠️ Verificar se alertas automáticos estão funcionando

### 5️⃣ Analytics Mínimo
- [ ] Faturação diária
- [ ] Produtos top vendidos
- [ ] Horários de pico
- ❌ **Fora de escopo:** Gráficos complexos. "O dono quer decidir amanhã, não ler gráfico bonito."

**Status Atual:**
- ⚠️ Verificar se há analytics básico implementado

---

## 🔵 FASE 3 — "ESCALA OU VENDA" (Decisão Estratégica)
*Só inicia se houver clientes reais e receita.*

- [x] Mobile App Nativo (PWA primeiro) ✅ **COMPLETO**
- [x] Multi-location ✅ **COMPLETO**
- [x] CRM / Loyalty ✅ **COMPLETO**
- [x] Uber Eats / Deliveroo ✅ **COMPLETO**

**Status Atual:**
- ✅ FASE 3 está 100% completa
- ✅ Todos os componentes implementados
- ⚠️ **PRÓXIMO:** Validação em produção

---

## 🌍 FASE 4 — "EXPANSÃO E ECOSSISTEMA" (Futuro)
*Transformar ChefIApp em plataforma internacional e ecossistema completo.*

**Pré-requisitos:**
- ✅ FASE 3 estável (2,500+ restaurantes)
- ✅ NPS 60+
- ✅ Series A Funding (€10-15M)

### Componentes:
- [ ] Expansão Internacional (Espanha, França, Alemanha, UK)
- [ ] Ecossistema (White-label, Hardware, Suppliers)
- [ ] Operações Autônomas (Sistema toma decisões)

**Status Atual:**
- 🟡 Planejamento completo
- ⚠️ **AGUARDANDO:** Estabilização FASE 3 e funding

**Documentação:** `FASE4_PLANO_ACAO.md`

---

## ❌ O QUE NÃO FAREMOS AGORA (Armadilhas de Roadmap)
- **Feature Parity com Last.app:** É suicídio tentar copiar quem tem 10x mais recursos.
- **Mobile App Nativo (Agora):** Web App bem feito resolve.
- **Micro-otimizações visuais:** Se funciona e não é feio, está pronto.

---

## 💡 CRITÉRIO DE SUCESSO DA FASE 1
**Cenário de Teste:**
1. Desligar o roteador do restaurante.
2. Criar pedidos, imprimir na cozinha, fechar contas.
3. Religar o roteador.
4. Tudo sincroniza sem intervenção humana.

**Resultado:** "Você pode vender sem medo."

---

## 🔗 CONEXÃO COM TRABALHO ATUAL

### ✅ Completado Recentemente:
- ✅ **RLS + Race Conditions:** Base de segurança para multi-tenant
- ✅ **TabIsolatedStorage:** Base para offline mode
- ✅ **Refatoração localStorage:** Preparação para sincronização offline

### 🎯 Próximos Passos Alinhados ao Roadmap:

1. **Validar Offline Mode:**
   - Testar `useOfflineReconciler`
   - Validar IndexedDB para pedidos offline
   - Implementar sincronização automática

2. **Integração Glovo:**
   - Verificar APIs disponíveis
   - Criar webhook receiver
   - Integrar com sistema de pedidos

3. **Fiscal Mínimo:**
   - Validar `fiscal_event_store`
   - Implementar geração SAF-T
   - Testar emissão de fatura

---

## 📊 PRIORIZAÇÃO

**URGENTE (Esta semana):**
1. ✅ Validar migrations RLS aplicadas
2. ⚠️ Testar offline mode básico
3. ⚠️ Verificar integração Glovo (se já existe)

**IMPORTANTE (Próximas 2 semanas):**
1. Implementar sincronização offline completa
2. Testar cenário "desligar roteador"
3. Validar fiscal mínimo

**FUTURO:**
- AppStaff melhorias
- Analytics básico
- Multi-location (se necessário)

---

**Última atualização:** 2026-01-16
