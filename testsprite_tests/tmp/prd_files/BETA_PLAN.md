# PLANO DE BETA CONTROLADO
## ChefIApp POS — 1-3 Restaurantes → TPV Ready

**Data:** 2025-12-24  
**Objetivo:** Provar que o funil funciona sozinho, sem suporte humano  
**Critério de Sucesso:** ≥1 restaurante completa Start → TPV Ready  

---

## SUMÁRIO EXECUTIVO

### O Que Estamos a Testar

**Não estamos a testar:**
- Features individuais (já funcionam)
- UX teórica (já foi auditada)
- Performance técnica (já está otimizada)

**Estamos a testar:**
- **1 restaurante real consegue ir de clique → TPV ativo sem ajuda?**
- Onde abandona (se abandonar)?
- Quanto tempo demora?
- Que dúvidas surgem?

Se **1 consegue** → produto vendável  
Se **3 conseguem** → produto escalável

---

## PRÉ-REQUISITOS TÉCNICOS

### Bloqueantes (sem isto, não há beta)

| Item | Estado Atual | Ação Necessária |
|------|--------------|-----------------|
| **Backend ativo** | ✅ Existe (`web-module-api-server.ts`) | Confirmar porta 4320 acessível |
| **Health check** | ✅ Implementado (`/health`) | Validar timeout 1200ms funciona |
| **Auth real** | ❌ Google OAuth mock | Implementar ou usar email+magic link |
| **Slug validation** | ❌ Sem verificação unicidade | Adicionar check duplicate no POST identity |
| **Logging básico** | ⚠️ Console apenas | Adicionar logs estruturados por restaurantId |

### Nice-to-Have (não bloqueiam, mas ajudam)

- Sentry/error tracking
- Analytics (Posthog/Mixpanel)
- Admin dashboard para observar estado dos pilotos

---

## PERFIL DE RESTAURANTES PILOTO

### Critérios de Seleção (1-3 restaurantes)

**Tamanho:**
- Pequeno/médio (1-3 funcionários)
- Faturação mensal < €30k
- Sem TPV atual ou TPV frustrado

**Motivação:**
- Quer testar novo sistema
- Aceita ser "cobaia" em troca de gratuidade temporária
- Disponível para feedback rápido (WhatsApp/Telegram)

**Tipo de Negócio:**
- ✅ Café/pastelaria
- ✅ Restaurante casual
- ✅ Bar/snack bar
- ❌ Evitar: Fine dining, franchises, grupos

**Onde Encontrar:**
- Rede pessoal
- Grupos Facebook de restauração
- LinkedIn (donos de pequenos negócios)
- Bairros com comércio local ativo

### Proposta de Valor para Piloto

> "Testa o nosso TPV sem custo durante 2 meses. Se funcionar, tens priority pricing. Se não funcionar, tens €0 perdidos."

---

## CHECKLIST PRÉ-BETA

### 1. Backend Ready

- [ ] `npm run server:web-module` roda sem erros
- [ ] `/health` responde 200 OK
- [ ] `/api/onboarding/start` cria restaurante
- [ ] `/internal/wizard/{id}/state` retorna estado correto
- [ ] Database acessível via `docker-compose up db`

### 2. Auth Funcional

**Opção A: Magic Link (recomendado para beta)**
```
POST /api/auth/request-magic-link { email }
→ Envia email com token
GET /api/auth/verify-magic-link?token=...
→ Retorna session_token
```

**Opção B: Google OAuth (ideal para produção)**
- Configurar Google Cloud OAuth
- Callback URL para `/api/auth/google/callback`

### 3. Observabilidade

- [ ] Logs estruturados por `restaurant_id`
- [ ] Track critical events:
  - `onboarding_start`
  - `identity_complete`
  - `menu_complete`
  - `publish_clicked`
  - `tpv_ready`
  - `first_order_received`

### 4. Fallbacks Testados

- [ ] Backend offline → modo demo funciona
- [ ] Slug duplicado → mensagem clara
- [ ] Preview erro 404 → GhostPreview aparece

### 5. Copy Final

- [ ] Remover hardcoded "sofia-gastrobar"
- [ ] Texto de erro amigável (PT-PT)
- [ ] CTA claro em cada step

---

## PROCESSO DE OBSERVAÇÃO

### Como Monitorar (Sem Interferir)

**Setup:**
1. Dashboard simples (`/internal/beta-dashboard`)
   - Lista pilotos
   - Step atual
   - Tempo decorrido
   - Última atividade

2. Alertas silenciosos (Telegram/Slack):
   - "🟢 Piloto X completou Identity"
   - "🔴 Piloto Y abandonou em Menu há 2h"

**Regras de Intervenção:**

| Situação | Ação |
|----------|------|
| Abandono < 5 min | Nada. Normal. |
| Abandono 5-30 min | Observar. Pode voltar. |
| Abandono > 30 min | Mensagem passiva: "Tudo ok? Alguma dúvida?" |
| Erro técnico visível | Intervir imediatamente |

### Dados a Capturar

**Quantitativos:**
- Tempo total (start → TPV ready)
- Tempo por step
- Taxa de abandono por step
- Número de tentativas (retry)

**Qualitativos:**
- Feedback espontâneo
- Perguntas feitas
- "Moments of delight" (se houver)
- "Moments of confusion"

---

## CRITÉRIOS DE ABORT/PIVOT

### Sinais de "Parar Tudo"

| Sinal | Ação |
|-------|------|
| **3 pilotos abandonam no mesmo step** | Problema estrutural → fix obrigatório |
| **Erro técnico recorrente** | Backend instável → resolver antes de continuar |
| **Feedback: "não percebi nada"** | Copy/UX falhou → redesign do step |
| **Nenhum piloto completa em 48h** | Algo está muito errado |

### Sinais de "Ajustar e Continuar"

- 1 piloto completa, 2 abandonam → investigar causas específicas
- Tempo médio > 10 min → simplificar steps
- Perguntas repetidas → melhorar copy/hints

---

## TIMELINE BETA

### Semana 1: Setup

**Dias 1-2:**
- [ ] Implementar auth (magic link OU Google OAuth)
- [ ] Adicionar slug validation
- [ ] Setup logging estruturado

**Dias 3-4:**
- [ ] Testar funil end-to-end com backend
- [ ] Validar fallbacks
- [ ] Deploy backend em servidor acessível (Fly.io/Railway/Render)

**Dia 5:**
- [ ] Recrutar 1-3 pilotos
- [ ] Enviar link + briefing

### Semana 2: Observação

**Dias 1-3:**
- Monitorar silenciosamente
- Capturar dados
- Intervir apenas se bloqueio técnico

**Dias 4-5:**
- Recolher feedback
- Análise de métricas
- Decisão: GO / NO-GO para escala

---

## MÉTRICAS DE SUCESSO

### Mínimo Viável

| Métrica | Alvo |
|---------|------|
| Taxa de conclusão | ≥33% (1 de 3) |
| Tempo médio | <10 minutos |
| Abandonos no mesmo step | <50% |
| Erros técnicos críticos | 0 |

### Objetivo Ideal

| Métrica | Alvo |
|---------|------|
| Taxa de conclusão | ≥67% (2 de 3) |
| Tempo médio | <5 minutos |
| Feedback positivo | ≥2 "isto é fácil" |
| Primeiro pedido recebido | Dentro de 24h após publish |

---

## PLANO DE CONTINGÊNCIA

### Se Backend Cai

- Frontend já tem graceful degradation (modo demo)
- Notificar pilotos: "estamos a resolver, dados guardados"
- SLA interno: <1h para restore

### Se Piloto Abandona

- Não insistir
- Perguntar "o que faltou?"
- Documentar razão
- Continuar com próximo

### Se Descobrirmos Bug Crítico

1. Parar novos pilotos
2. Fix urgente
3. Re-testar internamente
4. Retomar beta

---

## PRÓXIMO PASSO IMEDIATO

**Ação 1: Implementar Auth Real**

Escolher:
- [ ] Magic Link (mais rápido, suficiente para beta)
- [ ] Google OAuth (melhor para produção)

**Ação 2: Deploy Backend**

Opções:
- Fly.io (recomendado, Docker-native)
- Railway (simples, bom para MVP)
- Render (free tier limitado)

**Ação 3: Recrutar Piloto #1**

Template de mensagem:
```
Olá [Nome],

Estou a lançar um TPV para restaurantes (sem comissões, sem contratos).

Procuro 1-2 negócios para testar — grátis, sem compromisso.

Demorar 5 min a configurar. Se não gostar, pára e pronto.

Interesse?
```

---

## VEREDICTO

**Estado do Produto:** 85/100 — Pronto para Beta Controlado  
**Bloqueante Real:** Auth + Backend Deploy  
**Risco Principal:** Não encontrar pilotos motivados  
**Upside:** Se funcionar, temos caso de estudo vendável  

---

**Próximo Relatório:** Após Semana 1 (Setup Completo)  
**Checkpoint Crítico:** 1º Piloto Completa Funil
